import * as Notifications from "expo-notifications";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import * as Device from "expo-device";
import { NOTIFICATION_STRINGS } from "../constants/Notifications";
import { getFirebaseApp } from "./firebase.utils";

// Test function to verify Firebase messaging setup
export const testFirebaseMessaging = async () => {
  console.log("Testing Firebase messaging setup...");
  
  try {
    // Test Firebase initialization
    const app = getFirebaseApp();
    console.log("Firebase app:", app.name, app.options.projectId);
    
    // Test messaging instance
    const messagingInstance = messaging();
    console.log("Messaging instance created successfully");
    
    // Check if we can get an FCM token
    const token = await messagingInstance.getToken();
    console.log("FCM token:", token ? token.substring(0, 20) + "..." : "null");
    
    // Check authorization status
    const authStatus = await messagingInstance.requestPermission();
    console.log("FCM authorization status:", authStatus);
    
    return {
      firebaseInitialized: true,
      hasToken: !!token,
      authStatus,
      token: token ? token.substring(0, 20) + "..." : null
    };
  } catch (error) {
    console.error("Firebase messaging test failed:", error);
    return {
      firebaseInitialized: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const registerForPushNotificationsAsync = async () => {
  console.log("Starting push notification registration...");
  console.log("Device info:", { isDevice: Device.isDevice, platform: Platform.OS });
  
  if (!Device.isDevice) {
    console.warn(NOTIFICATION_STRINGS.EXPO_PUSH_TOKEN_WARNING);
    return null;
  }

  try {
    if (Platform.OS === "android") {
      console.log("Setting up Android notification channel...");
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250], // Optional: Add vibration
        sound: "notification.wav", // Make sure to include the extension
        lightColor: "#FF231F7C",
      });
      console.log("Android notification channel created successfully");
    }

    console.log("Checking existing Expo notification permissions...");
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log("Existing Expo permission status:", existingStatus);
    
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      console.log("Requesting Expo notification permissions...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("New Expo permission status:", finalStatus);
    }

    if (finalStatus !== "granted") {
      console.error("Expo notification permissions not granted:", finalStatus);
      // We can leave this Alert here as it's not part of the crash handler
      Alert.alert("Permission for push notifications is not granted!");
      return null;
    }

    console.log("Getting device push token...");
    const result = await Notifications.getDevicePushTokenAsync();
    const token = result.data;

    console.log("Expo Push Token received:", token ? token.substring(0, 20) + "..." : "null");

    // Save the token to the server
    if (token) {
      console.log("Saving token to server...");
      await savePushToken(token);
      console.log("Token saved successfully");
    } else {
      console.error("No token received from Expo");
    }

    return token;
  } catch (error) {
    console.error("Error in registerForPushNotificationsAsync:", error);
    return null;
  }
};

export const handleNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
) => {
  console.log("Notification received:", remoteMessage);
  await Notifications.scheduleNotificationAsync({
    content: {
      title:
        remoteMessage.notification?.title ??
        NOTIFICATION_STRINGS.NEW_NOTIFICATION,
      subtitle: "Test subtitle",
      body: remoteMessage.notification?.body ?? "You received a new message",
      sound: "notification.wav",
      badge: 1,
      vibrate: [0, 250, 250, 250],
      priority: Notifications.AndroidNotificationPriority.HIGH,
      color: "#FF231F7C",
      // @ts-ignore - interruptionLevel is for iOS
      interruptionLevel: "critical",
      autoDismiss: false,
      sticky: true,
      categoryIdentifier: "new-message",
    },
    trigger: null,
  });
};

// Handle foreground notifications
export const handleForegroundNotification = () => {
  console.log("Setting up foreground notification handler...");
  
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log("Foreground FCM message received:", JSON.stringify(remoteMessage, null, 2));

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title ?? "New Notification",
          subtitle: "Test subtitle",
          body: remoteMessage.notification?.body ?? "You received a new message",
          data: { extraData: "Some data", ...remoteMessage.data },
          sound: "notification.wav",
          badge: 1,
          vibrate: [0, 250, 250, 250],
          priority: Notifications.AndroidNotificationPriority.HIGH,
          color: "#FF231F7C",
          // @ts-ignore - interruptionLevel is for iOS
          interruptionLevel: "critical",
          autoDismiss: false,
          sticky: true,
          categoryIdentifier: "new-message",
        },
        trigger: null,
      });
      console.log("Local notification scheduled successfully");
    } catch (error) {
      console.error("Error scheduling local notification:", error);
    }
  });
  
  console.log("Foreground notification handler set up successfully");
  return unsubscribe;
};

// Handle background & quit-state notifications
export const handleBackgroundNotifications = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("Background message received:", remoteMessage);
  });

  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("Notification opened from background:", remoteMessage);
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log("Notification opened from quit state:", remoteMessage);
      }
    });
};

export const savePushToken = async (token: string): Promise<void> => {
  console.log("Attempting to save push token:", token.substring(0, 20) + "...");
  
  try {
    const payload = {
      endpoint: "https://fcm.googleapis.com/fcm/send",
      keys: { token },
      type: "fcm",
    };
    
    console.log("Sending payload to server:", payload);
    
    const response = await fetch(
      "https://api.codebuilder.org/notifications/subscribe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    console.log("Server response status:", response.status);
    const responseText = await response.text();
    console.log("Server response body:", responseText);

    if (!response.ok) {
      throw new Error(`Error saving token: ${response.status} - ${responseText}`);
    }

    console.log("Push token saved to server successfully.");
  } catch (error) {
    console.error("Error saving push token to server:", error);
    throw error; // Re-throw so caller knows it failed
  }
};

// Example function to trigger a local notification
export async function triggerLocalSampleNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Job Notification",
      subtitle: "Test subtitle",
      body: "This is a test notification.",
      sound: "notification.wav",
      data: { extraData: "Some data" },
      badge: 1,
      vibrate: [0, 250, 250, 250],
      priority: Notifications.AndroidNotificationPriority.HIGH,
      color: "#FF231F7C",
      // @ts-ignore - interruptionLevel is for iOS
      interruptionLevel: "critical",
      autoDismiss: false,
      sticky: true,
      categoryIdentifier: "new-message",
    },
    trigger: null,
  });
}

/**
 * Displays a local system notification to inform the user of a fatal app error.
 * This is used in the global exception handler as a replacement for Alert.
 * @param error The fatal error that was caught.
 */
export async function showFatalErrorNotification(error: Error) {
  // Also log the full error to the console for local debugging
  console.error("A fatal error occurred:", error);

  try {
    // We can show a snippet of the error message to the user
    // Be mindful that some error messages may not be user-friendly
    const errorMessage = error.message || "No error message available.";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Application Error",
        body: `A critical error occurred. Please restart the app. \nError: ${errorMessage}`,
        sound: "notification.wav", // Ensure this sound file exists in your assets
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // show immediately
    });
  } catch (e) {
    console.error("Failed to show fatal error notification:", e);
  }
}
