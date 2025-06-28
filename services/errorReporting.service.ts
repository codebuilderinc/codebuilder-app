import { Platform } from "react-native";
import { ErrorInfo } from "react";

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

const ERROR_REPORTING_ENDPOINT = "https://new.codebuilder.org/api/errors";

// Wrap fetch in a safe function so it never throws
export const safeReport = async (
  error: Error,
  options?: ReportOptions
): Promise<void> => {
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
    const response = await fetch(ERROR_REPORTING_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      console.error(
        "Failed to send error report:",
        `Status: ${response.status}`,
        `StatusText: ${response.statusText}`,
        response,
        report
      );
    }
  } catch (e) {
    console.error("Error sending error report (swallowed):", e);
  }
};

// Original API for backward compatibility
export const reportError = (
  maybeError: unknown,
  options?: ReportOptions
): void => {
  const error =
    maybeError instanceof Error
      ? maybeError
      : new Error(
          typeof maybeError === "string"
            ? maybeError
            : JSON.stringify(maybeError) || "Unknown non-Error thrown"
        );
  // Fire-and-forget
  void safeReport(error, options);
};
