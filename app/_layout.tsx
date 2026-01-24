// app/_layout.tsx
import { useEffect } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { SplashScreen, Stack } from 'expo-router';
import 'react-native-reanimated';

import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { View, Button } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { usePushNotifications, useNotificationObserver } from '@/hooks/usePushNotifications';
import { registerBackgroundFetch } from '@/utils/tasks.utils';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NotificationProvider } from '@/providers/NotificationProvider';

// ✅ import from providers + hooks (don’t import AuthProvider from hooks)
import { AuthProvider } from '@/providers/AuthProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import { useAuth } from '@/hooks/useAuth';

import { setJSExceptionHandler, getJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';

// Global error handling is centralized in errorHandler.service
// ✅ keep pathing consistent with your alias
//import { setupGlobalErrorHandlers } from '@/services/errorHandler.service';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://3b08e871dc551e5b8cce10dcaf1f1724@o1347126.ingest.us.sentry.io/4510152390868992',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  //enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Prevent auto-hiding the splash until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {
    /* no-op */
});

// Register global handlers at module load (earlier than any component effects)
//setupGlobalErrorHandlers({ baseContext: { tags: { entry: 'root-layout' } } });

const exceptionhandler = (error: any, isFatal: boolean) => {
    console.log('ExceptionHandler called with error: ', error, 'isFatal: ', isFatal);
    // your error handler function
};

const exceptionhandler2 = (exceptionString: string) => {
    console.log('Native ExceptionHandler called with exception: ', exceptionString);
    // your exception handler code here
};

const setNativeExceptionHandlerClick = () => {
    setNativeExceptionHandler(exceptionhandler2,  false, false);
    // - exceptionhandler is the exception handler function
    // - forceAppQuit is an optional ANDROID specific parameter that defines
    //    if the app should be force quit on error.  default value is true.
    //    To see usecase check the common issues section.
    // - executeDefaultHandler is an optional boolean (both IOS, ANDROID)
    //    It executes previous exception handlers if set by some other module.
    //    It will come handy when you use any other crash analytics module along with this one
    //    Default value is set to false. Set to true if you are using other analytics modules.
};

const setJSExceptionHandlerClick = () => {
    const originalConsoleError = console.error;
    setJSExceptionHandler(exceptionhandler, true);
};

const getJSExceptionHandlerClick = () => {
    // getJSExceptionHandler gives the currently set JS exception handler
    const currentHandler = getJSExceptionHandler();
    console.log("current JS Exception Handler: ", currentHandler.toString);
};

// --- Component Definition ---
export default Sentry.wrap(function RootLayout() {
    const navigationRef = useNavigationContainerRef();

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
        <SessionProvider>
            <AuthProvider>
                <NotificationBootstrap />
                <RootLayoutNav />
                 <View style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Button title="setJSExceptionHandler" onPress={setJSExceptionHandlerClick} />
                    <Button title="getJSExceptionHandler" onPress={getJSExceptionHandlerClick} />
                </View>
                <View style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Button title="setNativeExceptionHandler" onPress={setNativeExceptionHandlerClick} />
                </View>
            </AuthProvider>
        </SessionProvider>
    );
});

// Forced dark theme (can be extended later for dynamic theming)
const ForcedDarkTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: '#000000',
        card: '#000000',
        text: '#ffffff',
        border: '#222222',
        primary: '#ffffff',
    },
};

function RootLayoutNav() {
    const { user } = useAuth();
    // Avoid logging during render to prevent side-effects in LogViewer
    useEffect(() => {
        console.log('User: ', user);
    }, [user]);

    // (global handlers now set at module scope above)

    return (
        <ErrorBoundary>
            <NotificationProvider>
                <ThemeProvider value={ForcedDarkTheme}>
                    <View style={{ flex: 1, backgroundColor: '#000' }}>
                        <StatusBar style="light" backgroundColor="#000" translucent={false} />
                        <Stack
                            screenOptions={{
                                contentStyle: { backgroundColor: '#000' },
                                headerStyle: { backgroundColor: '#000' },
                            }}
                        >
                            {user ? <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> : <Stack.Screen name="login" options={{ headerShown: false }} />}
                            <Stack.Screen name="debug" options={{ title: 'Debug' }} />
                            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                        </Stack>
                    </View>
                </ThemeProvider>
            </NotificationProvider>
        </ErrorBoundary>
    );
}

// Separate component so hooks mount within providers
function NotificationBootstrap() {
    usePushNotifications();
    useNotificationObserver();
    return null;
}