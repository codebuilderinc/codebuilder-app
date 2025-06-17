import { Platform } from "react-native";
import { ErrorInfo } from "react";

// The URL for your self-hosted error reporting endpoint.
const ERROR_REPORTING_ENDPOINT = "https://new.codebuilder.org/api/errors";

interface ReportOptions {
  isFatal?: boolean;
  errorInfo?: ErrorInfo;
}

interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: string;
  platform: string;
  options?: ReportOptions;
}

/**
 * Sends an error report to your custom endpoint.
 * @param error The error object.
 * @param options An object containing additional context like isFatal or errorInfo.
 */
export const reportError = async (
  error: Error,
  options?: ReportOptions
): Promise<void> => {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    options,
  };

  try {
    const response = await fetch(ERROR_REPORTING_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      console.error("Failed to send error report:", response.status);
    }
  } catch (e) {
    console.error("Error sending error report:", e);
  }
};
