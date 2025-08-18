// app/_layout.tsx
import { useEffect } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { SplashScreen, Stack } from 'expo-router';
import 'react-native-reanimated';

import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { usePushNotifications, useNotificationObserver } from '@/hooks/usePushNotifications';
import { useColorScheme } from '@/hooks/useColorScheme';
import { registerBackgroundFetch } from '@/utils/tasks.utils';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NotificationProvider } from '@/providers/NotificationProvider';

// ✅ import from providers + hooks (don’t import AuthProvider from hooks)
import { AuthProvider } from '@/providers/AuthProvider';
import { useAuth } from '@/hooks/useAuth';

import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import { safeReport } from '@/services/errorReporting.service';
import { showFatalErrorNotification } from '@/utils/notifications.utils';
// ✅ keep pathing consistent with your alias
import { setupGlobalErrorHandlers } from '@/utils/globalErrorhandler';

// Prevent auto-hiding the splash until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {
    /* no-op */
});

// --- Global Exception Handler Setup ---
const jsExceptionHandler = (maybeError: unknown, isFatal: boolean) => {
    const error = maybeError instanceof Error ? maybeError : new Error(typeof maybeError === 'string' ? maybeError : JSON.stringify(maybeError) || 'Unknown non-Error thrown');

    console.log('Caught JS Exception:', error, isFatal);

    safeReport(error, {
        isFatal,
        errorInfo: { componentStack: 'jsExceptionHandler' },
    });

    if (isFatal) showFatalErrorNotification(error);
};

const nativeExceptionHandler = (exceptionString: string) => {
    console.log('Caught Native Exception:', exceptionString);
    const error = new Error(`Native Exception: ${exceptionString}`);

    safeReport(error, {
        isFatal: true,
        errorInfo: { componentStack: 'nativeExceptionHandler' },
    });

    showFatalErrorNotification(error);
};

setJSExceptionHandler(jsExceptionHandler, true);
setNativeExceptionHandler(nativeExceptionHandler);

// --- Component Definition ---
export default function RootLayout() {
    const navigationRef = useNavigationContainerRef();

    // Enable push notifications and observer
    usePushNotifications();
    useNotificationObserver();

    // Register background fetch task
    useEffect(() => {
        registerBackgroundFetch();
    }, []);

    // React Navigation DevTools
    useReactNavigationDevTools(navigationRef);

    // Load fonts
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        ...FontAwesome.font,
    });

    // Hide the splash screen once fonts are loaded
    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [loaded]);

    if (!loaded) return null;

    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();
    const { user } = useAuth();
    // Avoid logging during render to prevent side-effects in LogViewer
    useEffect(() => {
        console.log('User: ', user);
    }, [user]);

    useEffect(() => {
        setupGlobalErrorHandlers();
    }, []);

    return (
        <ErrorBoundary>
            <NotificationProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack>
                        {user ? <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> : <Stack.Screen name="login" options={{ headerShown: false }} />}
                        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                    </Stack>
                </ThemeProvider>
            </NotificationProvider>
        </ErrorBoundary>
    );
}
