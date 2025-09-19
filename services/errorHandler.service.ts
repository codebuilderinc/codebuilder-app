// Removed react-native-exception-handler; implementing lightweight JS/global handlers manually.
// Native test exception helper
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// Removed rn-test-exception-handler (deprecated / incompatible). We'll simulate native error instead.
// import RnTestExceptionHandler from 'rn-test-exception-handler';
import { notifyError } from '@/services/notifier.service';
import { showFatalErrorNotification } from '@/utils/notifications.utils';
import { Alert, Platform, NativeModules } from 'react-native';

// ============================================================================
// Error Reporting (merged from former errorReporting.service.ts)
// ----------------------------------------------------------------------------
export interface ReportOptions {
  /** Will be set by the global handlers for native vs JS */
  isFatal?: boolean;
  /** Logical source (hook / component / boundary / task) */
  componentStack?: string;
  /** Arbitrary labels for filtering (small strings only) */
  tags?: Record<string, string>;
  /** Extra structured diagnostic data */
  extra?: Record<string, unknown>;
}

export interface ErrorReport {
  id: string; // client generated id for tracing
  name: string;
  message: string;
  stack?: string;
  cause?: string;
  timestamp: string;
  platform: string;
  isFatal?: boolean;
  componentStack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

const ERROR_REPORTING_ENDPOINT = 'https://api.codebuilder.org/errors';

// Lightweight circuit breaker to avoid spamming backend on outages.
const circuitBreaker = {
  failureCount: 0,
  lastFailureTime: 0,
  isOpen: false,
  failureThreshold: 3,
  resetTimeout: 60_000, // 1 min
  baseDelay: 5_000, // 5s
  maxDelay: 3_600_000, // 1h
  shouldPreventApiCall(): boolean {
    if (!this.isOpen) return false;
    const now = Date.now();
    const elapsed = now - this.lastFailureTime;
    const backoff = Math.min(this.baseDelay * Math.pow(2, this.failureCount - 1), this.maxDelay);
    return elapsed <= backoff;
  },
  recordSuccess(): void {
    if (this.failureCount > 0) console.log('Error reporting API recovered');
    this.failureCount = 0;
    this.isOpen = false;
  },
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.isOpen = true;
      const backoff = Math.min(this.baseDelay * Math.pow(2, this.failureCount - 1), this.maxDelay);
      console.log(`Circuit opened after ${this.failureCount} failures. Retrying in ~${Math.round(backoff / 1000)}s`);
    }
  },
};

let isReportingError = false;
let nestedReportCount = 0;
const MAX_NESTED_REPORTS = 3;

function buildReport(error: Error, opts?: ReportOptions): ErrorReport {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: error.name,
    message: error.message || String(error),
    stack: error.stack || undefined,
    cause: (error as any).cause ? String((error as any).cause) : undefined,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    isFatal: opts?.isFatal,
    componentStack: opts?.componentStack,
    tags: opts?.tags,
    extra: opts?.extra,
  };
}

// Safe JSON stringify preventing circular reference explosions
function safeStringify(value: any, depth = 0, seen = new WeakSet()): string {
  try {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (seen.has(value)) return '"[Circular]"';
    if (depth > 5) return '"[Truncated]"';
    seen.add(value);
    if (Array.isArray(value)) {
  return '[' + value.slice(0, 50).map((v: any) => safeStringify(v, depth + 1, seen)).join(',') + (value.length > 50 ? ',"[+more]"' : '') + ']';
    }
    const keys = Object.keys(value).slice(0, 50);
  const body = keys.map((k: string) => JSON.stringify(k) + ':' + safeStringify((value as any)[k], depth + 1, seen)).join(',');
    return '{' + body + (Object.keys(value).length > 50 ? ',"[+more]":"truncated"' : '') + '}';
  } catch {
    try { return JSON.stringify(String(value)); } catch { return '"[Unserializable]"'; }
  }
}

async function sendReportInternal(report: ErrorReport) {
  if (isReportingError) {
    nestedReportCount++;
    if (nestedReportCount >= MAX_NESTED_REPORTS) {
      console.log('Nested error reporting limit reached – aborting');
      return;
    }
    return; // ignore additional nested errors
  }

  if (circuitBreaker.shouldPreventApiCall()) {
    console.log('Error reporting circuit open – skipping');
    return;
  }

  console.log('[error-report] sending', {
    id: report.id,
    name: report.name,
    isFatal: report.isFatal,
    componentStack: report.componentStack,
    tags: report.tags,
  });

  try {
    isReportingError = true;
    const resp = await fetch(ERROR_REPORTING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!resp.ok) {
      console.error('[error-report] failed', report.id, resp.status, resp.statusText);
      circuitBreaker.recordFailure();
    } else {
      console.log('[error-report] success', report.id);
      circuitBreaker.recordSuccess();
    }
  } catch (e) {
    console.error('[error-report] exception while sending', report.id, e);
    circuitBreaker.recordFailure();
  } finally {
    isReportingError = false;
    nestedReportCount = 0;
  }
}

export function reportError(maybeError: unknown, options?: ReportOptions): void {
  let error: Error;
  if (maybeError instanceof Error) {
    error = maybeError;
  } else if (typeof maybeError === 'string') {
    error = new Error(maybeError);
  } else {
    let serialized = 'Unknown non-Error thrown';
    try { serialized = safeStringify(maybeError); } catch {}
    error = new Error(serialized);
  }

  try {
    const report = buildReport(error, options);
    void sendReportInternal(report);
  } catch (internalErr) {
    // Final fallback to avoid cascading crashes
    try { console.error('[error-report] internal failure', internalErr); } catch {}
  }
}

export interface GlobalErrorHandlerOptions {
  useSystemAlert?: boolean;
  verbose?: boolean;
  baseContext?: Partial<ReportOptions>; // merged into every report
}

let configured = false;

export function setupGlobalErrorHandlers(opts: GlobalErrorHandlerOptions = {}) {
  if (configured) return;
  configured = true;
  const { useSystemAlert = false, verbose = true, baseContext = {} } = opts;

  // JS global handler (ErrorUtils is provided by RN runtime)
  const originalHandler: any = (global as any).ErrorUtils?.getGlobalHandler?.();
  (global as any).ErrorUtils?.setGlobalHandler?.((maybeError: any, isFatal?: boolean) => {
    const error = maybeError instanceof Error ? maybeError : new Error(typeof maybeError === 'string' ? maybeError : JSON.stringify(maybeError) || 'Unknown error');
    if (verbose) console.error('[GlobalError]', error, 'isFatal:', isFatal);
    reportError(error, { isFatal, componentStack: 'global.js', ...baseContext });
    if (isFatal) showFatalErrorNotification(error);
    if (useSystemAlert) {
      try { Alert.alert('Unexpected Error', 'The app hit a problem but will try to continue.'); } catch {}
    } else if (isFatal) {
      notifyError(error, 'A fatal error occurred. The app may be unstable.');
    }
    // Call original so RN red screen still appears in dev
    try { originalHandler?.(maybeError, isFatal); } catch {}
  });

  // We can't directly hook native crashes without a module; rely on JS side reporting only.
  if (verbose) console.log('[ErrorHandler] Global handlers initialized (JS only)');
}

export function simulateGlobalError(message = 'Simulated error') {
  throw new Error(message);
}

// Safer async variant that lets the global handler catch it without an immediate red screen
export function simulateAsyncGlobalError(message = 'Simulated async error') {
  setTimeout(() => {
    throw new Error(message);
  }, 0);
}

// Single helper to raise a native exception via rn-test-exception-handler
export function triggerNativeTestException() {
  // Simulate a fatal-style error path; we can't raise a true native crash without a helper lib.
  console.warn('[NativeTest] Simulating native exception (library removed).');
  // Use setTimeout so global handler catches it like an async native callback.
  setTimeout(() => {
    throw new Error('Simulated Native Exception (stub)');
  }, 0);
}
