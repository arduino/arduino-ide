/**
 * Small centralized safe logger for node-side code running in Electron main process.
 * It performs lightweight checks and wraps console writes in try/catch to avoid
 * uncaught write errors (EPIPE) when stdout/stderr are closed.
 */
export function safeDebug(...args: unknown[]): void {
  try {
    // Prefer console.debug if available
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      // avoid writing when stdout is not writable (best-effort)
      // process may be undefined in some test contexts
      if (typeof process !== 'undefined' && process.stdout && !process.stdout.writable) {
        return;
      }
      console.debug(...(args as any));
    }
  } catch (e) {
    // swallow logging errors
  }
}

export function safeInfo(...args: unknown[]): void {
  try {
    if (typeof console !== 'undefined' && typeof console.info === 'function') {
      if (typeof process !== 'undefined' && process.stdout && !process.stdout.writable) {
        return;
      }
      console.info(...(args as any));
    }
  } catch (e) {
    // swallow logging errors
  }
}

export function safeWarn(...args: unknown[]): void {
  try {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      if (typeof process !== 'undefined' && process.stderr && !process.stderr.writable) {
        return;
      }
      console.warn(...(args as any));
    }
  } catch (e) {
    // swallow logging errors
  }
}

export function safeLog(...args: unknown[]): void {
  try {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      if (typeof process !== 'undefined' && process.stdout && !process.stdout.writable) {
        return;
      }
      console.log(...(args as any));
    }
  } catch (e) {
    // swallow logging errors
  }
}

export function safeError(...args: unknown[]): void {
  try {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      if (typeof process !== 'undefined' && process.stderr && !process.stderr.writable) {
        return;
      }
      console.error(...(args as any));
    }
  } catch (e) {
    // swallow logging errors
  }
}

export default {
  debug: safeDebug,
  info: safeInfo,
  warn: safeWarn,
  log: safeLog,
  error: safeError,
};
