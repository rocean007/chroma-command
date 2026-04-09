/**
 * Minimal structured logging — JSON in production, human-readable in development.
 */
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function base(level, message, meta = {}) {
  const payload = { level, message, ts: new Date().toISOString(), ...meta };
  const line = IS_PRODUCTION ? JSON.stringify(payload) : `[${payload.ts}] ${level.toUpperCase()} ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

module.exports = {
  info: (message, meta) => base('info', message, meta),
  warn: (message, meta) => base('warn', message, meta),
  error: (message, meta) => base('error', message, meta),
};
