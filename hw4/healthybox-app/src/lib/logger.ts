export type LogLevel = 'info' | 'warning' | 'error';

export interface LogRecord {
  ts: string;
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'apikey', 'email'];

/** Replaces values of sensitive keys so that secrets and personal data never reach logs. */
function redact(context: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.includes(k.toLowerCase()) ? '[REDACTED]' : v,
    ]),
  );
}

/** Builds one structured (JSON) log record. */
export function buildRecord(
  level: LogLevel,
  msg: string,
  context: Record<string, unknown> = {},
  now: Date = new Date(),
): LogRecord {
  return { ...redact(context), ts: now.toISOString(), level, msg };
}

function write(level: LogLevel, msg: string, context?: Record<string, unknown>): void {
  const line = JSON.stringify(buildRecord(level, msg, context));
  if (level === 'error') console.error(line);
  else if (level === 'warning') console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (msg: string, context?: Record<string, unknown>) => write('info', msg, context),
  warning: (msg: string, context?: Record<string, unknown>) => write('warning', msg, context),
  error: (msg: string, context?: Record<string, unknown>) => write('error', msg, context),
};
