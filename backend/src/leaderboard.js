// ============================================================
// LEADERBOARD — in-memory, sorted by wins descending
// ============================================================
const express = require('express');
const Joi = require('joi');

const router = express.Router();
const MAX_SIZE = parseInt(process.env.LEADERBOARD_SIZE || '100', 10);

/** @type {Array<{playerId,playerName,commander,wins,losses,totalScore,bestScore,lastSeen}>} */
let entries = [];

// ── helpers ──────────────────────────────────────────────────

function calculateWinRate(wins, losses) {
  const total = wins + losses;
  if (total === 0) return '0.00%';
  return ((wins / total) * 100).toFixed(2) + '%';
}

function upsert(playerId, playerName, commander) {
  let entry = entries.find(e => e.playerId === playerId);
  if (!entry) {
    entry = {
      playerId,
      playerName: sanitizeName(playerName),
      commander,
      wins: 0,
      losses: 0,
      totalScore: 0,
      bestScore: 0,
      lastSeen: new Date().toISOString(),
    };
    entries.push(entry);
  } else {
    entry.playerName = sanitizeName(playerName);
    entry.commander = commander;
    entry.lastSeen = new Date().toISOString();
  }
  return entry;
}

function sanitizeName(name = '') {
  return String(name).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'Unknown';
}

function sortAndTrim() {
  entries.sort((a, b) => b.wins - a.wins || b.totalScore - a.totalScore);
  if (entries.length > MAX_SIZE) entries = entries.slice(0, MAX_SIZE);
}

// ── public API ────────────────────────────────────────────────

function recordWin(playerId, playerName, commander, score = 0) {
  const entry = upsert(playerId, playerName, commander);
  entry.wins += 1;
  entry.totalScore += score;
  if (score > entry.bestScore) entry.bestScore = score;
  sortAndTrim();
  console.log(`[LEADERBOARD] WIN recorded — ${entry.playerName} (${entry.wins}W/${entry.losses}L)`);
}

function recordLoss(playerId, playerName, commander, score = 0) {
  const entry = upsert(playerId, playerName, commander);
  entry.losses += 1;
  entry.totalScore += score;
  if (score > entry.bestScore) entry.bestScore = score;
  sortAndTrim();
  console.log(`[LEADERBOARD] LOSS recorded — ${entry.playerName} (${entry.wins}W/${entry.losses}L)`);
}

function getLeaderboard(limit = 50) {
  return entries.slice(0, Math.min(limit, MAX_SIZE)).map(e => ({
    ...e,
    winRate: calculateWinRate(e.wins, e.losses),
  }));
}

function getPlayerStats(playerId) {
  const entry = entries.find(e => e.playerId === playerId);
  if (!entry) return null;
  return { ...entry, winRate: calculateWinRate(entry.wins, entry.losses) };
}

// ── REST routes ───────────────────────────────────────────────

const limitSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
});

router.get('/', (req, res) => {
  const { error, value } = limitSchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.message });
  const leaderboard = getLeaderboard(value.limit);
  res.json({ leaderboard, total: leaderboard.length });
});

// FIX: allow UUIDs from matchmaking plus seed-* ids; reject weird paths / ReDoS-sized input
const playerIdParamSchema = Joi.string().max(128).pattern(/^[a-zA-Z0-9_.\-]+$/).required();

router.get('/:playerId', (req, res) => {
  const { error, value } = playerIdParamSchema.validate(req.params.playerId);
  if (error) return res.status(400).json({ error: 'Invalid player id' });
  const stats = getPlayerStats(value);
  if (!stats) return res.status(404).json({ error: 'Player not found' });
  res.json(stats);
});

// Dev-only seed route
router.post('/seed', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
  }
  const commanders = ['forge', 'echo', 'bastion', 'mirage'];
  const names = ['NeonRaider', 'CrystalFox', 'VoidWalker', 'EchoStrike', 'ForgeMaster',
                 'PulseRider', 'ChromaKing', 'DataGhost', 'QuantumBit', 'SynthWave'];
  entries = [];
  for (let i = 0; i < 10; i++) {
    const wins = Math.floor(Math.random() * 50);
    const losses = Math.floor(Math.random() * 30);
    const score = wins * 300 + Math.floor(Math.random() * 1000);
    entries.push({
      playerId: `seed-${i}`,
      playerName: names[i],
      commander: commanders[i % commanders.length],
      wins,
      losses,
      totalScore: score,
      bestScore: Math.floor(score / Math.max(wins, 1)),
      lastSeen: new Date().toISOString(),
    });
  }
  sortAndTrim();
  res.json({ message: 'Seeded 10 entries', leaderboard: getLeaderboard() });
});

module.exports = { router, recordWin, recordLoss, getLeaderboard, getPlayerStats };
