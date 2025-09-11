import { Platform } from 'react-native';
import { ErrorInfo } from 'react';

export interface ReportOptions {
    isFatal?: boolean;
    errorInfo?: ErrorInfo;
}

export interface ErrorReport {
    name: string;
    cause?: string;
    message: string;
    stack?: string;
    timestamp: string;
    platform: string;
    options?: ReportOptions;
}

const ERROR_REPORTING_ENDPOINT = 'https://api.codebuilder.org/errors';

// Circuit breaker implementation
const circuitBreaker = {
    failureCount: 0,
    lastFailureTime: 0,
    isOpen: false,
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute in ms
    baseDelay: 5000, // 5 seconds initial delay
    maxDelay: 3600000, // 1 hour maximum delay
    shouldPreventApiCall(): boolean {
        if (this.isOpen) {
            const now = Date.now();
            const timeSinceLastFailure = now - this.lastFailureTime;
            const currentBackoff = Math.min(this.baseDelay * Math.pow(2, this.failureCount - 1), this.maxDelay);
            if (timeSinceLastFailure > currentBackoff) {
                // Allow one test request
                return false;
            }
            return true;
        }
        return false;
    },
    recordSuccess(): void {
        if (this.failureCount > 0) {
            console.log('Error reporting API is back online');
        }
        this.failureCount = 0;
        this.isOpen = false;
    },
    recordFailure(): void {
        const now = Date.now();
        this.failureCount++;
        this.lastFailureTime = now;
        if (this.failureCount >= this.failureThreshold) {
            this.isOpen = true;
            const backoffTime = Math.min(this.baseDelay * Math.pow(2, this.failureCount - 1), this.maxDelay);
            console.log(`Circuit opened after ${this.failureCount} failures. Will retry in ${backoffTime / 1000}s`);
        }
    },
};

// Flag to prevent recursive error reporting
let isReportingError = false;
// Count nested error reporting attempts to detect potential infinite loops
let nestedReportCount = 0;
const MAX_NESTED_REPORTS = 3;

// Wrap fetch in a safe function so it never throws

export const safeReport = async (error: Error, options?: ReportOptions): Promise<void> => {
    // Prevent recursive error reporting
    if (isReportingError) {
        nestedReportCount++;
        console.log(`Already reporting an error, skipping to prevent recursion (depth: ${nestedReportCount})`);

        // If we detect too many nested error reports, something is wrong
        if (nestedReportCount >= MAX_NESTED_REPORTS) {
            console.log('Too many nested error reports - likely an infinite loop. Breaking the cycle.');
            return;
        }
        return;
    }
    // Check if circuit breaker is open
    if (circuitBreaker.shouldPreventApiCall()) {
        console.log('Error reporting circuit is open, skipping API call');
        return;
    }

    // Build normalized report
    const report: ErrorReport = {
        name: error.name,
        message: error.message || String(error),
        stack: error.stack || undefined,
        cause: error.cause ? String(error.cause) : undefined,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        options,
    };

    try {
        isReportingError = true;
        const response = await fetch(ERROR_REPORTING_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report),
        });

        if (!response.ok) {
            // Use console.log to avoid triggering global error handler
            console.log('Failed to send error report:', `Status: ${response.status}`, `StatusText: ${response.statusText}`, response, report);
            circuitBreaker.recordFailure();
        } else {
            circuitBreaker.recordSuccess();
        }
    } catch (e) {
        // Use console.log to avoid triggering global error handler
        console.log('Error sending error report (swallowed):', e);
        circuitBreaker.recordFailure();
    } finally {
        isReportingError = false;
        nestedReportCount = 0; // Reset the nested count when we're done
    }
};

// Original API for backward compatibility

export const reportError = (maybeError: unknown, options?: ReportOptions): void => {
    const error = maybeError instanceof Error ? maybeError : new Error(typeof maybeError === 'string' ? maybeError : JSON.stringify(maybeError) || 'Unknown non-Error thrown');
    // Fire-and-forget
    void safeReport(error, options);
};
