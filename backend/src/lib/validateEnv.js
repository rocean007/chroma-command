const logger = require('./logger');

function parsePort(v, fallback) {
  const n = parseInt(v || String(fallback), 10);
  if (Number.isNaN(n) || n < 1 || n > 65535) return null;
  return n;
}

/**
 * Fail fast on bad configuration — avoids running in a broken or unsafe state.
 */
function validateEnv() {
  const errors = [];
  const PORT = parsePort(process.env.PORT, 3001);
  if (!PORT) errors.push('PORT must be 1–65535');

  const frontend = process.env.FRONTEND_URL || '';
  if (process.env.NODE_ENV === 'production') {
    if (!frontend.trim()) errors.push('FRONTEND_URL is required in production (comma-separated origins allowed)');
    if (frontend.includes('*')) errors.push('FRONTEND_URL must not contain * — list explicit origins');
  }

  const maxWs = parseInt(process.env.MAX_WSS_CLIENTS || '800', 10);
  if (Number.isNaN(maxWs) || maxWs < 1) errors.push('MAX_WSS_CLIENTS invalid');

  if (process.env.TRUST_PROXY === '1' && process.env.ENABLE_HSTS === '1') {
    logger.warn('ENABLE_HSTS=1: ensure users only reach this app over HTTPS (typically via reverse proxy)');
  }

  if (errors.length) {
    errors.forEach(e => logger.error('env validation failed', { detail: e }));
    throw new Error(`Invalid environment: ${errors.join('; ')}`);
  }

  return { PORT };
}

module.exports = { validateEnv, parsePort };
