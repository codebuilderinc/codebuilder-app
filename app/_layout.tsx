import { useEffect, useState } from "react";
// import * as Notifications from "expo-notifications";
import { useNavigationContainerRef } from "@react-navigation/native";
import { useReactNavigationDevTools } from "@dev-plugins/react-navigation";
import { SplashScreen } from "expo-router";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useNotificationObserver } from "../hooks/usePushNotifications";
// import { registerForPushNotificationsAsync } from "../utils/notifications";
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
import { useColorScheme } from "@/components/useColorScheme";

export default function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Enable push notifications and observe notification responses
  usePushNotifications();
  useNotificationObserver();

  // Enable React Navigation DevTools for debugging
  useReactNavigationDevTools(navigationRef);

  // Load fonts
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // useEffect(() => {
  //   // Initialize Firebase app
  //   try {
  //     getFirebaseApp();
  //     console.log("Firebase initialized in RootLayout");
  //   } catch (error) {
  //     console.error("Firebase initialization error:", error);
  //   }

  //   // Register for push notifications and get the push token
  //   registerForPushNotificationsAsync().then((token) => {
  //     if (token) {
  //       setExpoPushToken(token); // Store the push token
  //     }
  //   });

  //   return () => {
  //     console.log("Cleanup RootLayout effect");
  //   };
  // }, []);

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
  // useNotificationObserver(); // Moved to RootLayout to prevent unnecessary re-renders

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
