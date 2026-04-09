// ============================================================
// CHROMA COMMAND — Main Server Entry Point
// ============================================================
require('dotenv').config();

const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const logger = require('./lib/logger');
const runtimeState = require('./lib/runtimeState');
const { validateEnv } = require('./lib/validateEnv');
const { handleConnection, startHeartbeat } = require('./matchmaking');
const { router: leaderboardRouter } = require('./leaderboard');
const healthRouter = require('./routes/health');

let validated;
try {
  validated = validateEnv();
} catch (e) {
  logger.error('startup aborted', { err: e.message });
  process.exit(1);
}

const PORT = validated.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0';

const ALLOWED_ORIGINS = FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean);

const WS_ALLOWED_ORIGINS = (process.env.WS_ALLOWED_ORIGINS || FRONTEND_URL)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const MAX_WSS_CLIENTS = parseInt(process.env.MAX_WSS_CLIENTS || '800', 10);
const MAX_WS_PAYLOAD = parseInt(process.env.MAX_WS_MSG_BYTES || '16384', 10);

// ── Express setup ─────────────────────────────────────────────

const app = express();
app.disable('x-powered-by');

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: process.env.ENABLE_HSTS === '1'
    ? { maxAge: 31536000, includeSubDomains: true, preload: false }
    : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json({ limit: '16kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  validate: process.env.TRUST_PROXY === '1' ? undefined : { trustProxy: false },
});

const leaderboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: IS_PRODUCTION ? 60 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  validate: process.env.TRUST_PROXY === '1' ? undefined : { trustProxy: false },
});

// Higher ceiling for probes; still bounded (scraping /api/health repeatedly hits this chain)
const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: IS_PRODUCTION ? 120 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  validate: process.env.TRUST_PROXY === '1' ? undefined : { trustProxy: false },
});

app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────

app.use('/api/health', healthLimiter, healthRouter);
app.use('/api/leaderboard', leaderboardLimiter, leaderboardRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, _next) => {
  logger.error('express error', { err: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

// ── HTTP + WebSocket server ───────────────────────────────────

const server = http.createServer(app);

const wss = new WebSocketServer({
  server,
  path: '/',
  maxPayload: MAX_WS_PAYLOAD,
  perMessageDeflate: false,
});

wss.on('connection', (ws, req) => {
  if (wss.clients.size > MAX_WSS_CLIENTS) {
    try { ws.close(1013, 'Server capacity'); } catch (_) { /* ignore */ }
    logger.warn('ws rejected: global client cap');
    return;
  }

  const origin = req.headers.origin;
  if (origin && !WS_ALLOWED_ORIGINS.includes(origin)) {
    try { ws.close(1008, 'Origin not allowed'); } catch (_) { /* ignore */ }
    logger.warn('ws rejected: origin', { origin });
    return;
  }
  const ip = req.socket.remoteAddress;
  logger.info('ws connection', { ip });
  handleConnection(ws, req);
});

const heartbeatInterval = startHeartbeat(wss);

// ── Startup ───────────────────────────────────────────────────

server.listen(PORT, LISTEN_HOST, () => {
  logger.info('server listening', {
    host: LISTEN_HOST,
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    corsOrigins: ALLOWED_ORIGINS.length,
  });
});

// ── Graceful shutdown ─────────────────────────────────────────

let shutdownRequested = false;

function shutdown(signal) {
  if (shutdownRequested) return;
  shutdownRequested = true;
  logger.info('shutdown received', { signal });

  runtimeState.setShuttingDown();
  clearInterval(heartbeatInterval);

  wss.clients.forEach(ws => {
    try { ws.close(1001, 'Server shutting down'); } catch (_) { /* ignore */ }
  });

  server.close((err) => {
    if (err) logger.error('http close error', { err: err.message });
    else logger.info('http server closed');
    process.exit(err ? 1 : 0);
  });

  setTimeout(() => {
    logger.error('shutdown forced after timeout');
    process.exit(1);
  }, 30000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { err: err.message, stack: err.stack });
  if (IS_PRODUCTION) process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason: String(reason) });
  if (IS_PRODUCTION) process.exit(1);
});
