import * as Notifications from "expo-notifications";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import { useEffect } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import { router } from "expo-router";
import * as Device from "expo-device";
import { getFirebaseApp } from "@/utils/firebase";
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
      Alert.alert("Permission for push notifications is not granted!");
      return null;
    }

    const result = await Notifications.getDevicePushTokenAsync();
    const token = result.data;

    console.log("Expo Push Token:", token);

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
      body: remoteMessage.notification?.body ?? "You received a new message",
    },
    trigger: null,
  });
};

export const handleForegroundNotification = () => {
  return messaging().onMessage(async (remoteMessage) => {
    await handleNotification(remoteMessage);
  });
};

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

// DEPRACATED
// export const requestAndroidNotificationPermission =
//   async (): Promise<boolean> => {
//     if (Platform.OS === "android" && Platform.Version >= 33) {
//       const hasPermission = await PermissionsAndroid.check(
//         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//       );

//       if (!hasPermission) {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       }
//     }
//     return true;
//   };

//   // DEPRACATED
// export const requestPermission = async (): Promise<boolean> => {
//   const androidPermission = await requestAndroidNotificationPermission();
//   const authStatus = await messaging().requestPermission();
//   const isAuthorized =
//     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//   if (!androidPermission || !isAuthorized) {
//     console.warn("Push notification permissions are not granted.");
//     return false;
//   }
//   return true;
// };

export const savePushToken = async (token: string): Promise<void> => {
  try {
    const response = await fetch("https://new.codebuilder.org/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://fcm.googleapis.com/fcm/send",
        keys: { token },
        type: "fcm",
      }),
    });

    if (!response.ok) {
      throw new Error(`Error saving token: ${response.statusText}`);
    }

    console.log("Push token saved to server successfully.");
  } catch (error) {
    console.error("Error saving push token to server:", error);
  }
};
