type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  route?: string;
}

function formatEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.route ? `[${entry.route}]` : null,
    entry.message,
  ].filter(Boolean);

  if (entry.context && Object.keys(entry.context).length > 0) {
    return `${parts.join(" ")} ${JSON.stringify(entry.context)}`;
  }
  return parts.join(" ");
}

function log(
  level: LogLevel,
  message: string,
  opts?: { context?: Record<string, unknown>; route?: string },
) {
  const entry: LogEntry = {
    level,
    message,
    context: opts?.context,
    route: opts?.route,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }

  // Structured JSON output for log aggregators (Vercel, DataDog, etc.)
  // Vercel automatically captures stdout/stderr as structured logs.
  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (message: string, opts?: { context?: Record<string, unknown>; route?: string }) =>
    log("info", message, opts),

  warn: (message: string, opts?: { context?: Record<string, unknown>; route?: string }) =>
    log("warn", message, opts),

  error: (message: string, opts?: { context?: Record<string, unknown>; route?: string }) =>
    log("error", message, opts),

  /** Log an caught error with optional route context */
  captureException: (
    err: unknown,
    opts?: { route?: string; context?: Record<string, unknown> },
  ) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log("error", message, {
      route: opts?.route,
      context: { ...opts?.context, stack },
    });
  },
};
