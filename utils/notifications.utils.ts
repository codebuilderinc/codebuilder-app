import * as Notifications from "expo-notifications";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import * as Device from "expo-device";
import { NOTIFICATION_STRINGS } from "../constants/Notifications";

export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.warn(NOTIFICATION_STRINGS.EXPO_PUSH_TOKEN_WARNING);
    return null;
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250], // Optional: Add vibration
        sound: "notification.wav", // Make sure to include the extension
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      // We can leave this Alert here as it's not part of the crash handler
      Alert.alert("Permission for push notifications is not granted!");
      return null;
    }

    const result = await Notifications.getDevicePushTokenAsync();
    const token = result.data;

    console.log("Expo Push Token:", token);

    // Save the token to the server
    if (token) {
      await savePushToken(token);
    }

    return token;
  } catch (error) {
    console.error("Error fetching push token:", error);
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
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log("Foreground message received:", remoteMessage);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification?.title ?? "New Notification",
        subtitle: "Test subtitle",
        body: remoteMessage.notification?.body ?? "You received a new message",
        data: { extraData: "Some data" },
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
  });
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
  try {
    const response = await fetch(
      "https://api.codebuilder.org/notifications/subscribe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "https://fcm.googleapis.com/fcm/send",
          keys: { token },
          type: "fcm",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error saving token: ${response.statusText}`);
    }

    console.log("Push token saved to server successfully.");
  } catch (error) {
    console.error("Error saving push token to server:", error);
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
