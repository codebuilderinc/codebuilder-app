import { useEffect } from "react";
import { useNavigationContainerRef } from "@react-navigation/native";
import { useReactNavigationDevTools } from "@dev-plugins/react-navigation";
import { SplashScreen } from "expo-router";
import {
  usePushNotifications,
  useNotificationObserver,
} from "@/hooks/usePushNotifications";
import { useFonts } from "expo-font";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { registerBackgroundFetch } from "@/utils/tasks.utils";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

import {
  setJSExceptionHandler,
  setNativeExceptionHandler,
} from "react-native-exception-handler";
import { reportError, safeReport } from "@/services/errorReporting.service";
import { showFatalErrorNotification } from "@/utils/notifications.utils";
import { setupGlobalErrorHandlers } from "../utils/globalErrorhandler";

// --- Global Exception Handler Setup ---

const jsExceptionHandler = (maybeError: unknown, isFatal: boolean) => {
  const error =
    maybeError instanceof Error
      ? maybeError
      : new Error(
          typeof maybeError === "string"
            ? maybeError
            : JSON.stringify(maybeError) || "Unknown non-Error thrown"
        );

  console.log("Caught JS Exception:", error, isFatal);

  // Use safeReport to avoid throwing from inside handler
  safeReport(error, {
    isFatal,
    errorInfo: { componentStack: "jsExceptionHandler" },
  });

  if (isFatal) {
    showFatalErrorNotification(error);
  }
};

const nativeExceptionHandler = (exceptionString: string) => {
  console.log("Caught Native Exception:", exceptionString);
  const error = new Error(`Native Exception: ${exceptionString}`);

  safeReport(error, {
    isFatal: true,
    errorInfo: { componentStack: "nativeExceptionHandler" },
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

  // Enable React Navigation DevTools
  useReactNavigationDevTools(navigationRef);

  // Load fonts
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Hide the splash screen once fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          {user ? (
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="login" options={{ headerShown: false }} />
          )}
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
