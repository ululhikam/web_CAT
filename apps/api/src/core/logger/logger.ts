import pino, { type Logger } from 'pino';

let rootLogger: Logger | undefined;

/**
 * Logger JSON (pino). Di development dipretty bila tersedia; di produksi
 * mengeluarkan JSON murni agar bisa dibaca Vercel log drain.
 */
export function getLogger(level = process.env.LOG_LEVEL ?? 'info'): Logger {
  if (rootLogger) return rootLogger;

  const isDev = process.env.NODE_ENV === 'development';
  rootLogger = pino({
    level,
    base: { service: 'webcat-api', env: process.env.NODE_ENV },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        '*.password',
        'token',
        '*.token',
        'refreshToken',
        'code',
        '*.code',
      ],
      remove: true,
    },
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,service,env' },
          },
        }
      : {}),
  });

  return rootLogger;
}

export function resetLogger(): void {
  rootLogger = undefined;
}
