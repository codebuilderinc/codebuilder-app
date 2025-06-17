import { useEffect, useState } from "react";
// import * as Notifications from "expo-notifications";
import { useNavigationContainerRef } from "@react-navigation/native";
import { useReactNavigationDevTools } from "@dev-plugins/react-navigation";
import { SplashScreen } from "expo-router";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotificationObserver } from "@/hooks/usePushNotifications";
// import { registerForPushNotificationsAsync } from "@/utils/notifications";
// import { getFirebaseApp } from "@/utils/firebase";
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
// FIX 2: Import the exception handlers from the library
import {
  setJSExceptionHandler,
  setNativeExceptionHandler,
} from "react-native-exception-handler";
import { reportError } from "@/services/errorReporting.service";
import { ErrorInfo } from "react";

// --- NEW: Import our notification function ---
import { showFatalErrorNotification } from "@/utils/notifications.utils";

// --- Global Exception Handler Setup ---

const jsExceptionHandler = (error: Error, isFatal: boolean) => {
  console.log("Caught JS Exception:", error, isFatal);
  reportError(error, { isFatal });

  if (isFatal) {
    // Pass the error to the notification function
    showFatalErrorNotification(error);
  }
};

const nativeExceptionHandler = (exceptionString: string) => {
  console.log("Caught Native Exception:", exceptionString);
  const error = new Error(`Native Exception: ${exceptionString}`);
  reportError(error, { isFatal: true });

  // Pass the newly created error to the notification function
  showFatalErrorNotification(error);
};

setJSExceptionHandler(jsExceptionHandler, true);
setNativeExceptionHandler(nativeExceptionHandler);

// --- Component Definition ---

export default function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Enable push notifications and observe notification responses
  usePushNotifications();
  useNotificationObserver();

  // Register background fetch task
  useEffect(() => {
    registerBackgroundFetch();
  }, []);

  // Enable React Navigation DevTools for debugging
  useReactNavigationDevTools(navigationRef);

  // Load fonts
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Handle font loading errors
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide the splash screen once fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Prevent rendering until fonts are loaded
  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
