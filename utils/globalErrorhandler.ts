import {
  setJSExceptionHandler,
  setNativeExceptionHandler,
} from "react-native-exception-handler";
import { Alert } from "react-native";
import { reportError } from "../services/errorReporting.service";

// JavaScript Error Handler
export const setupGlobalErrorHandlers = () => {
  setJSExceptionHandler((error, isFatal) => {
    // Report the error using your actual reportError function
    reportError(error, { isFatal });

    // Show a friendly message instead of crashing
    Alert.alert(
      "Unexpected Error Occurred",
      "We encountered an issue. The app will continue running, and our team has been notified.",
      [{ text: "OK" }]
    );
  }, true);

  // Native Exception Handler
  setNativeExceptionHandler(
    (exceptionString) => {
      // This is called when native code throws an exception
      const error = new Error(`Native Exception: ${exceptionString}`);
      reportError(error, { isFatal: true });
    },
    false, // don't force app to quit
    true // should catch all exceptions
  );
};
