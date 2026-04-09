const express = require('express');
const router = express.Router();
const { getStats } = require('../matchmaking');
const runtimeState = require('../lib/runtimeState');

const START_TIME = Date.now();
const VERSION = process.env.APP_VERSION || '1.0.0';

/** Full status — useful for ops dashboards (rate-limited in server). */
router.get('/', (req, res) => {
  const { playersOnline, activeMatches, queueSize } = getStats();
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    playersOnline,
    activeMatches,
    queueSize,
    version: VERSION,
    timestamp: new Date().toISOString(),
  });
});

/** Kubernetes / LB liveness — process is up. */
router.get('/live', (_req, res) => {
  res.status(200).json({ live: true });
});

/** Readiness — stop routing traffic during graceful shutdown. */
router.get('/ready', (_req, res) => {
  if (!runtimeState.isReady()) {
    return res.status(503).json({ ready: false });
  }
  res.status(200).json({ ready: true });
});

module.exports = router;
