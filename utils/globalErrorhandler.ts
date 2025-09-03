import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import { reportError } from '../services/errorReporting.service';
import { notifyError } from '@/services/notifier.service';

// JavaScript Error Handler
export const setupGlobalErrorHandlers = () => {
    setJSExceptionHandler((error, isFatal) => {
        // Always print error to console for debugging
        console.error('Global JS Exception:', error, 'isFatal:', isFatal);
        // Report the error using your actual reportError function
        reportError(error, { isFatal });

        // Show a non-blocking stacked banner instead of a modal alert
        notifyError(error, 'We encountered an issue. The app will continue running, and our team has been notified.');
    }, true);

    // Native Exception Handler
    setNativeExceptionHandler(
        (exceptionString) => {
            // Always print native exception to console
            console.error('Global Native Exception:', exceptionString);
            // This is called when native code throws an exception
            const error = new Error(`Native Exception: ${exceptionString}`);
            reportError(error, { isFatal: true });
        },
        false, // don't force app to quit
        true // should catch all exceptions
    );
};
