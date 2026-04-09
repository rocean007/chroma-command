# CHROMA COMMAND — Backend Server

Real-time WebSocket + REST backend for **CHROMA COMMAND: THE LIVING PROTOCOL**.

---

## Quick Start

```bash
cd backend
npm install
cp .env.example .env
npm run dev        # development (nodemon)
# or
npm start          # production
```

Server starts at:
- REST API: `http://localhost:3001/api`
- WebSocket: `ws://localhost:3001`

---

## REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server status, uptime, active matches |
| GET | `/api/leaderboard?limit=50` | Top players (max 100) |
| GET | `/api/leaderboard/:playerId` | Single player stats |
| POST | `/api/leaderboard/seed` | Seed fake data (dev only) |

---

## WebSocket Protocol

### Connect

```js
const ws = new WebSocket('ws://localhost:3001');
```

### Client → Server Messages

```json
{ "type": "JOIN_QUEUE",   "playerName": "Alice",  "commander": "forge" }
{ "type": "LEAVE_QUEUE" }
{ "type": "GAME_ACTION",  "matchId": "...",  "action": "harvest|attack|build" }
{ "type": "END_TURN",     "matchId": "..." }
{ "type": "PING" }
```

**Commanders:** `forge` | `echo` | `pulse` | `void`

**Actions:**
- `harvest` — +20 pts (+10 bonus for `forge`), +1 crystal, +8 interference
- `attack`  — +50 pts (+20 bonus for `echo`),  +12 interference
- `build`   — +30 pts, +1 conduit, +6 interference

### Server → Client Messages

```json
{ "type": "QUEUE_JOINED",  "playerId": "...", "position": 2 }
{ "type": "QUEUE_UPDATE",  "playersInQueue": 3 }
{ "type": "MATCH_FOUND",   "matchId": "...", "opponent": { "name": "Bob", "commander": "echo" } }
{ "type": "GAME_STATE",    "matchId": "...", "state": { ...full game state... } }
{ "type": "TURN_START",    "matchId": "...", "currentPlayer": "...", "turn": 5, "scores": {...}, "interference": 40 }
{ "type": "ACTION_RESULT", "matchId": "...", "playerId": "...", "action": "harvest", "points": 30, "newScore": 120, "scores": {...} }
{ "type": "ENV_EVENT",     "event": { "id": "crystal_bloom", "name": "Crystal Bloom", "desc": "..." } }
{ "type": "GAME_OVER",     "matchId": "...", "winner": "playerId", "finalScores": {...} }
{ "type": "OPPONENT_LEFT", "matchId": "..." }
{ "type": "ERROR",         "message": "..." }
{ "type": "PONG" }
```

---

## Vanilla JS Connection Example

```js
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'JOIN_QUEUE',
    playerName: 'Alice',
    commander: 'forge'
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case 'QUEUE_JOINED':
      console.log('In queue! Your ID:', msg.playerId);
      break;
    case 'MATCH_FOUND':
      console.log('Match found! Opponent:', msg.opponent.name);
      // Save matchId for future messages
      window.matchId = msg.matchId;
      break;
    case 'TURN_START':
      if (msg.currentPlayer === myPlayerId) {
        // My turn — send actions
        ws.send(JSON.stringify({ type: 'GAME_ACTION', matchId: msg.matchId, action: 'harvest' }));
      }
      break;
    case 'GAME_OVER':
      console.log('Game over! Winner:', msg.winner, 'Scores:', msg.finalScores);
      break;
  }
};
```

---

## Frontend Integration

### Add to your `.env` (frontend):
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### `MatchmakingQueue.tsx` — Replace mock:
```tsx
const ws = useRef<WebSocket | null>(null);

useEffect(() => {
  ws.current = new WebSocket(import.meta.env.VITE_WS_URL);

  ws.current.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'QUEUE_JOINED')  setPlayerId(msg.playerId);
    if (msg.type === 'QUEUE_UPDATE')  setQueueSize(msg.playersInQueue);
    if (msg.type === 'MATCH_FOUND')   { setMatchId(msg.matchId); setScreen('game'); }
    if (msg.type === 'TURN_START')    setCurrentPlayer(msg.currentPlayer);
    if (msg.type === 'ACTION_RESULT') setScores(msg.scores);
    if (msg.type === 'GAME_OVER')     setScreen('results');
  };

  ws.current.onopen = () => {
    ws.current!.send(JSON.stringify({
      type: 'JOIN_QUEUE',
      playerName: player.name,
      commander: player.commander?.id
    }));
  };

  return () => ws.current?.close();
}, []);
```

### `Leaderboard.tsx` — Replace mock:
```tsx
useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`)
    .then(r => r.json())
    .then(data => setEntries(data.leaderboard));
}, []);
```

### `gameStore.ts` — Send actions to server:
```ts
// Instead of local doAction():
ws.send(JSON.stringify({ type: 'GAME_ACTION', matchId, action: 'harvest' }));
// Server responds with ACTION_RESULT — update your store from that payload
```

---

## Architecture

```
server.js
  ├── Express (REST, helmet, cors, rate-limit)
  │     ├── /api/health       → routes/health.js
  │     └── /api/leaderboard  → leaderboard.js (router)
  │
  └── WebSocketServer (same port, path="/")
        └── matchmaking.js
              ├── queue: Map<playerId, PlayerEntry>
              ├── activeMatches: Map<matchId, GameState>
              ├── wsMeta: Map<ws, { playerId, isAlive, rateLimit... }>
              ├── handleConnection(ws)   — routes all WS messages
              ├── tryMatch()             — pairs 2 queued players
              ├── processAction()        — game logic per action
              ├── advanceTurn()          — conduit income, env events, turn swap
              └── startHeartbeat(wss)    — ping/pong, drop dead clients
```

### Key design decisions:
- **In-memory only**: restarts wipe state (fine for dev; add Redis for prod)
- **Rate limit**: 10 WS messages/second per client, 100 REST req/15min per IP
- **Heartbeat**: ping every 30s, terminate if no pong within 60s
- **Match timeout**: auto-ends match after `MATCH_TIMEOUT_MS` (default 60s)
- **Environmental events**: server-authoritative, fire every 2–4 turns randomly
