// ============================================================
// MATCHMAKING + GAME ENGINE — WebSocket-driven, in-memory
// ============================================================
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { recordWin, recordLoss } = require('./leaderboard');

const MATCH_TIMEOUT_MS = parseInt(process.env.MATCH_TIMEOUT_MS || '60000', 10);
const MAX_QUEUE_SIZE   = parseInt(process.env.MAX_QUEUE_SIZE  || '100',   10);
const HEARTBEAT_INTERVAL = 30_000;  // 30 s
const HEARTBEAT_TIMEOUT  = 60_000;  // 60 s — drop if no pong
const MSG_RATE_LIMIT     = 10;      // max msgs / second per client
// UNHACKABLE: per-IP socket cap — raises cost of multi-IP / botnet WS fan-in (not a full DDoS solution; use edge filtering)
const MAX_WS_PER_IP = parseInt(process.env.MAX_WS_PER_IP || '20', 10);
// UNHACKABLE: reject megabyte frames — slows JSON bomb / memory DoS on worker thread
const MAX_WS_MSG_BYTES = parseInt(process.env.MAX_WS_MSG_BYTES || '16384', 10);
// UNHACKABLE: auto-drop hot sockets hammering parse/validate (credential-spraying-style message flood)
const WS_RATE_VIOLATIONS_BEFORE_CLOSE = parseInt(process.env.WS_RATE_VIOLATIONS_BEFORE_CLOSE || '40', 10);
const wsConnectionsByIp = new Map();

// ── in-memory stores ─────────────────────────────────────────

/** Map<playerId, { playerId, playerName, commander, joinedAt, ws }> */
const queue = new Map();

/** Map<matchId, GameState> */
const activeMatches = new Map();

/** Map<ws, { playerId, lastSeen, messageCount, resetAt, isAlive }> */
const wsMeta = new Map();

// ── Joi validation schemas ────────────────────────────────────

const nameSchema   = Joi.string().pattern(/^[a-zA-Z0-9_]+$/).max(20).required();
// FIX: align with frontend CommanderSelect ids — was pulse/void (server rejected real clients)
const cmdSchema    = Joi.string().valid('forge', 'echo', 'bastion', 'mirage').required();
const actionSchema = Joi.string().valid('harvest', 'attack', 'build').required();
const msgTypeSchema = Joi.string().valid(
  'PING', 'JOIN_QUEUE', 'LEAVE_QUEUE', 'GAME_ACTION', 'END_TURN',
).required();

const schemas = {
  // FIX: require type to match schema key — prevents validated payloads with mismatched type + silent switch fall-through
  JOIN_QUEUE:   Joi.object({ type: msgTypeSchema.valid('JOIN_QUEUE'), playerName: nameSchema, commander: cmdSchema }),
  GAME_ACTION:  Joi.object({ type: msgTypeSchema.valid('GAME_ACTION'), matchId: Joi.string().uuid().required(), action: actionSchema }),
  END_TURN:     Joi.object({ type: msgTypeSchema.valid('END_TURN'), matchId: Joi.string().uuid().required() }),
  LEAVE_QUEUE:  Joi.object({ type: msgTypeSchema.valid('LEAVE_QUEUE') }),
  PING:         Joi.object({ type: msgTypeSchema.valid('PING') }),
};

// ── helpers ───────────────────────────────────────────────────

function send(ws, obj) {
  try {
    if (ws && ws.readyState === 1 /* OPEN */) ws.send(JSON.stringify(obj));
  } catch (e) {
    console.error('[WS] send error:', e.message);
  }
}

function broadcast(ws1, ws2, obj) {
  send(ws1, obj);
  send(ws2, obj);
}

function sanitizeName(name = '') {
  return String(name).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'Player';
}

function getWsForPlayer(playerId) {
  // Check queue first
  const q = queue.get(playerId);
  if (q) return q.ws;
  // Check active matches
  for (const [, match] of activeMatches) {
    if (match.player1.playerId === playerId) return match.player1.ws;
    if (match.player2.playerId === playerId) return match.player2.ws;
  }
  return null;
}

function findMatchForPlayer(playerId) {
  for (const [, match] of activeMatches) {
    if (match.player1.playerId === playerId || match.player2.playerId === playerId)
      return match;
  }
  return null;
}

// ── game state factory ────────────────────────────────────────

function createGameState(matchId, p1, p2) {
  return {
    matchId,
    player1Id: p1.playerId,
    player2Id: p2.playerId,
    player1Name: p1.playerName,
    player2Name: p2.playerName,
    player1Commander: p1.commander,
    player2Commander: p2.commander,
    currentPlayer: p1.playerId,
    turn: 1,
    scores:       { [p1.playerId]: 0, [p2.playerId]: 0 },
    crystals:     { [p1.playerId]: 0, [p2.playerId]: 0 },
    conduits:     { [p1.playerId]: 0, [p2.playerId]: 0 },
    interference: 0,
    actionsThisTurn: 0,
    maxActions: 2,
    winTarget: 500,
    nextEventTurn: 2 + Math.floor(Math.random() * 3), // trigger at turn 2–4
    startedAt: Date.now(),
    lastActionAt: Date.now(),
    timeoutHandle: null,
  };
}

// ── environmental events ──────────────────────────────────────

const ENV_EVENTS = [
  { id: 'chroma_storm',    name: 'Chroma Storm',    desc: 'Interference tears through both fields!',     apply: (s) => { s.scores[s.player1Id] -= 5; s.scores[s.player2Id] -= 5; } },
  { id: 'crystal_bloom',   name: 'Crystal Bloom',   desc: 'Crystals surge across the protocol!',         apply: (s) => { s.scores[s.player1Id] += 10; s.scores[s.player2Id] += 10; s.crystals[s.player1Id]++; s.crystals[s.player2Id]++; } },
  { id: 'anomaly_surge',   name: 'Anomaly Surge',   desc: 'Interference spikes wildly!',                 apply: (s) => { s.interference += 20; } },
  { id: 'resonance_wave',  name: 'Resonance Wave',  desc: 'Resonance flows — interference dampened!',    apply: (s) => { s.scores[s.player1Id] += 15; s.scores[s.player2Id] += 15; s.interference = Math.max(0, s.interference - 15); } },
  { id: 'field_collapse',  name: 'Field Collapse',  desc: 'The chroma field collapses briefly!',         apply: (s) => { s.scores[s.player1Id] -= 10; s.scores[s.player2Id] -= 10; } },
];

function maybeFireEvent(match, p1ws, p2ws) {
  if (match.state.turn < match.state.nextEventTurn) return;
  const ev = ENV_EVENTS[Math.floor(Math.random() * ENV_EVENTS.length)];
  console.log(`[GAME ${match.matchId}] ENV EVENT: ${ev.name}`);
  broadcast(p1ws, p2ws, { type: 'ENV_EVENT', event: { id: ev.id, name: ev.name, desc: ev.desc } });
  ev.apply(match.state);
  // Clamp scores to 0
  match.state.scores[match.state.player1Id] = Math.max(0, match.state.scores[match.state.player1Id]);
  match.state.scores[match.state.player2Id] = Math.max(0, match.state.scores[match.state.player2Id]);
  // Schedule next event 2–4 turns later
  match.state.nextEventTurn = match.state.turn + 2 + Math.floor(Math.random() * 3);
}

// ── win check ─────────────────────────────────────────────────

function checkWin(match, p1ws, p2ws) {
  const s = match.state;
  let winner = null;
  if (s.scores[s.player1Id] >= s.winTarget) winner = s.player1Id;
  else if (s.scores[s.player2Id] >= s.winTarget) winner = s.player2Id;
  if (!winner) return false;

  const loser = winner === s.player1Id ? s.player2Id : s.player1Id;
  const wName = winner === s.player1Id ? s.player1Name : s.player2Name;
  const lName = loser  === s.player1Id ? s.player1Name : s.player2Name;
  const wCmd  = winner === s.player1Id ? s.player1Commander : s.player2Commander;
  const lCmd  = loser  === s.player1Id ? s.player1Commander : s.player2Commander;

  console.log(`[GAME ${match.matchId}] GAME OVER — winner: ${wName}`);
  const payload = {
    type: 'GAME_OVER',
    matchId: match.matchId,
    winner,
    finalScores: s.scores,
  };
  broadcast(p1ws, p2ws, payload);

  recordWin (winner, wName, wCmd, s.scores[winner]);
  recordLoss(loser,  lName, lCmd, s.scores[loser]);

  clearTimeout(s.timeoutHandle);
  activeMatches.delete(match.matchId);
  return true;
}

// ── conduit passive income ────────────────────────────────────

function applyConduitIncome(state) {
  const gain1 = state.conduits[state.player1Id] * 10;
  const gain2 = state.conduits[state.player2Id] * 10;
  state.scores[state.player1Id] += gain1;
  state.scores[state.player2Id] += gain2;
  if (gain1 || gain2)
    console.log(`[CONDUIT INCOME] +${gain1} p1, +${gain2} p2`);
}

// ── advance turn ──────────────────────────────────────────────

function advanceTurn(match, p1ws, p2ws) {
  const s = match.state;
  applyConduitIncome(s);
  maybeFireEvent(match, p1ws, p2ws);

  if (checkWin(match, p1ws, p2ws)) return;

  // Swap current player
  s.currentPlayer = s.currentPlayer === s.player1Id ? s.player2Id : s.player1Id;
  s.turn++;
  s.actionsThisTurn = 0;

  console.log(`[GAME ${match.matchId}] TURN ${s.turn} — currentPlayer: ${s.currentPlayer}`);
  broadcast(p1ws, p2ws, {
    type: 'TURN_START',
    matchId: match.matchId,
    currentPlayer: s.currentPlayer,
    turn: s.turn,
    scores: s.scores,
    interference: s.interference,
  });
}

// ── action processing ─────────────────────────────────────────

function processAction(match, playerId, action, ws) {
  const s = match.state;
  if (s.currentPlayer !== playerId) {
    send(ws, { type: 'ERROR', message: 'Not your turn' });
    return;
  }
  if (s.actionsThisTurn >= s.maxActions) {
    send(ws, { type: 'ERROR', message: 'No actions remaining this turn' });
    return;
  }

  const isP1       = playerId === s.player1Id;
  const p1ws       = isP1 ? ws : getWsForPlayer(s.player1Id);
  const p2ws       = isP1 ? getWsForPlayer(s.player2Id) : ws;
  const commander  = isP1 ? s.player1Commander : s.player2Commander;

  let points = 0;
  switch (action) {
    case 'harvest':
      points = 20 + (commander === 'forge' ? 10 : 0);
      s.interference += 8;
      s.crystals[playerId]++;
      break;
    case 'attack':
      points = 50 + (commander === 'echo' ? 20 : 0);
      s.interference += 12;
      break;
    case 'build':
      points = 30;
      s.interference += 6;
      s.conduits[playerId]++;
      break;
  }

  s.scores[playerId] += points;
  s.actionsThisTurn++;
  s.lastActionAt = Date.now();

  console.log(`[GAME ${match.matchId}] ACTION ${action} by ${playerId} => +${points} pts (score: ${s.scores[playerId]})`);

  broadcast(p1ws, p2ws, {
    type: 'ACTION_RESULT',
    matchId: match.matchId,
    playerId,
    action,
    points,
    newScore: s.scores[playerId],
    scores: s.scores,
    interference: s.interference,
    crystals: s.crystals,
    conduits: s.conduits,
  });

  if (checkWin(match, p1ws, p2ws)) return;

  // Auto-advance after maxActions
  if (s.actionsThisTurn >= s.maxActions) {
    setTimeout(() => advanceTurn(match, p1ws, p2ws), 300);
  }
}

// ── matchmaking ───────────────────────────────────────────────

function tryMatch() {
  if (queue.size < 2) return;
  const iter = queue.values();
  const p1 = iter.next().value;
  const p2 = iter.next().value;

  queue.delete(p1.playerId);
  queue.delete(p2.playerId);

  const matchId = uuidv4();
  const state   = createGameState(matchId, p1, p2);

  // match timeout
  state.timeoutHandle = setTimeout(() => {
    const m = activeMatches.get(matchId);
    if (!m) return;
    console.log(`[GAME ${matchId}] TIMEOUT`);
    const tw = getWsForPlayer(m.state.player1Id);
    const ow = getWsForPlayer(m.state.player2Id);
    broadcast(tw, ow, { type: 'GAME_OVER', matchId, winner: null, reason: 'timeout', finalScores: m.state.scores });
    activeMatches.delete(matchId);
  }, MATCH_TIMEOUT_MS);

  const match = { matchId, player1: p1, player2: p2, state };
  activeMatches.set(matchId, match);

  console.log(`[MATCHMAKING] Match created: ${matchId} — ${p1.playerName} vs ${p2.playerName}`);

  send(p1.ws, { type: 'MATCH_FOUND', matchId, opponent: { name: p2.playerName, commander: p2.commander } });
  send(p2.ws, { type: 'MATCH_FOUND', matchId, opponent: { name: p1.playerName, commander: p1.commander } });

  // Send initial game state + turn start
  const initialState = { ...state, timeoutHandle: undefined };
  broadcast(p1.ws, p2.ws, { type: 'GAME_STATE', matchId, state: initialState });
  broadcast(p1.ws, p2.ws, { type: 'TURN_START', matchId, currentPlayer: p1.playerId, turn: 1, scores: state.scores, interference: 0 });
}

function broadcastQueueUpdate() {
  for (const [, p] of queue) {
    send(p.ws, { type: 'QUEUE_UPDATE', playersInQueue: queue.size });
  }
}

// ── disconnect handler ────────────────────────────────────────

function handleDisconnect(ws) {
  const meta = wsMeta.get(ws);
  if (!meta) return;
  const { playerId } = meta;
  wsMeta.delete(ws);

  if (queue.has(playerId)) {
    queue.delete(playerId);
    console.log(`[QUEUE] Player ${playerId} left queue (disconnect). Queue size: ${queue.size}`);
    broadcastQueueUpdate();
    return;
  }

  const match = findMatchForPlayer(playerId);
  if (match) {
    const opponentId = match.state.player1Id === playerId ? match.state.player2Id : match.state.player1Id;
    const oppWs = getWsForPlayer(opponentId);
    send(oppWs, { type: 'OPPONENT_LEFT', matchId: match.matchId });
    console.log(`[GAME ${match.matchId}] Player ${playerId} disconnected. Ending match.`);
    clearTimeout(match.state.timeoutHandle);
    activeMatches.delete(match.matchId);
  }
}

// ── rate limiter ──────────────────────────────────────────────

function isRateLimited(meta) {
  const now = Date.now();
  if (now > meta.resetAt) {
    meta.messageCount = 0;
    meta.resetAt = now + 1000;
  }
  meta.messageCount++;
  return meta.messageCount > MSG_RATE_LIMIT;
}

// ── main WebSocket handler ────────────────────────────────────

function getClientIp(req) {
  // UNHACKABLE: never trust X-Forwarded-For unless TRUST_PROXY=1 — otherwise attackers spoof IP and bypass per-IP limits (classic proxy misconfig)
  if (process.env.TRUST_PROXY === '1') {
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function handleConnection(ws, req) {
  const clientIp = getClientIp(req);
  const n = (wsConnectionsByIp.get(clientIp) || 0) + 1;
  if (n > MAX_WS_PER_IP) {
    try { ws.close(1008, 'Too many connections from this endpoint'); } catch (_) { /* ignore */ }
    console.warn(`[WS] Rejected connection from ${clientIp}: limit ${MAX_WS_PER_IP}`);
    return;
  }
  wsConnectionsByIp.set(clientIp, n);
  ws.once('close', () => {
    const c = (wsConnectionsByIp.get(clientIp) || 1) - 1;
    if (c <= 0) wsConnectionsByIp.delete(clientIp);
    else wsConnectionsByIp.set(clientIp, c);
  });

  const playerId = uuidv4();
  const meta = { playerId, lastSeen: Date.now(), messageCount: 0, resetAt: Date.now() + 1000, isAlive: true };
  wsMeta.set(ws, meta);

  console.log(`[WS] New connection — assigned playerId: ${playerId}`);

  ws.on('pong', () => {
    const m = wsMeta.get(ws);
    if (m) { m.isAlive = true; m.lastSeen = Date.now(); }
  });

  ws.on('message', (raw) => {
    try {
      const m = wsMeta.get(ws);
      if (!m) return;

      const byteLen = typeof raw === 'string' ? Buffer.byteLength(raw) : raw.length;
      if (byteLen > MAX_WS_MSG_BYTES) {
        send(ws, { type: 'ERROR', message: 'Message too large' });
        return;
      }

      if (isRateLimited(m)) {
        m.rateViolations = (m.rateViolations || 0) + 1;
        send(ws, { type: 'ERROR', message: 'Rate limit exceeded. Slow down.' });
        if (m.rateViolations >= WS_RATE_VIOLATIONS_BEFORE_CLOSE) {
          try { ws.close(1008, 'Sustained rate limit'); } catch (_) { /* ignore */ }
        }
        return;
      }

      let msg;
      try { msg = JSON.parse(raw); }
      catch { send(ws, { type: 'ERROR', message: 'Invalid JSON' }); return; }

      const schema = schemas[msg.type];
      if (!schema) { send(ws, { type: 'ERROR', message: `Unknown message type: ${msg.type}` }); return; }

      const { error, value } = schema.validate(msg);
      if (error) { send(ws, { type: 'ERROR', message: error.message }); return; }

      switch (value.type) {

        case 'PING':
          send(ws, { type: 'PONG' });
          break;

        case 'JOIN_QUEUE': {
          if (queue.size >= MAX_QUEUE_SIZE) {
            send(ws, { type: 'ERROR', message: 'Queue is full. Try again later.' });
            return;
          }
          if (queue.has(playerId) || findMatchForPlayer(playerId)) {
            send(ws, { type: 'ERROR', message: 'Already in queue or match' });
            return;
          }
          const playerName = sanitizeName(value.playerName);
          queue.set(playerId, { playerId, playerName, commander: value.commander, joinedAt: Date.now(), ws });
          console.log(`[QUEUE] ${playerName} joined. Queue size: ${queue.size}`);
          send(ws, { type: 'QUEUE_JOINED', playerId, position: queue.size });
          broadcastQueueUpdate();
          tryMatch();
          break;
        }

        case 'LEAVE_QUEUE': {
          if (queue.has(playerId)) {
            queue.delete(playerId);
            console.log(`[QUEUE] Player ${playerId} left queue. Queue size: ${queue.size}`);
            broadcastQueueUpdate();
          }
          break;
        }

        case 'GAME_ACTION': {
          const match = activeMatches.get(value.matchId);
          if (!match) { send(ws, { type: 'ERROR', message: 'Match not found' }); return; }
          processAction(match, playerId, value.action, ws);
          break;
        }

        case 'END_TURN': {
          const match = activeMatches.get(value.matchId);
          if (!match) { send(ws, { type: 'ERROR', message: 'Match not found' }); return; }
          const s = match.state;
          if (s.currentPlayer !== playerId) { send(ws, { type: 'ERROR', message: 'Not your turn' }); return; }
          const p1ws = getWsForPlayer(s.player1Id);
          const p2ws = getWsForPlayer(s.player2Id);
          advanceTurn(match, p1ws, p2ws);
          break;
        }

        default:
          // FIX: explicit reject — avoids silent no-op if schema/type wiring drifts
          send(ws, { type: 'ERROR', message: 'Unhandled message' });
          break;
      }
    } catch (err) {
      console.error('[WS] message handler error:', err);
      send(ws, { type: 'ERROR', message: 'Internal server error' });
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Connection closed — playerId: ${playerId}`);
    handleDisconnect(ws);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error for ${playerId}:`, err.message);
    handleDisconnect(ws);
  });
}

// ── heartbeat ─────────────────────────────────────────────────

function startHeartbeat(wss) {
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const meta = wsMeta.get(ws);
      if (!meta) { ws.terminate(); return; }
      if (!meta.isAlive || Date.now() - meta.lastSeen > HEARTBEAT_TIMEOUT) {
        console.log(`[HEARTBEAT] Terminating unresponsive client ${meta.playerId}`);
        handleDisconnect(ws);
        ws.terminate();
        return;
      }
      meta.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL);

  return interval;
}

// ── stats ─────────────────────────────────────────────────────

function getStats() {
  return {
    playersOnline:  wsMeta.size,
    activeMatches:  activeMatches.size,
    queueSize:      queue.size,
  };
}

module.exports = { handleConnection, startHeartbeat, getStats };
