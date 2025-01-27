import { useEffect, useState } from "react";
import {
  handleForegroundNotification,
  handleBackgroundNotifications,
  registerForPushNotificationsAsync,
} from "../utils/notifications.new";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { getFirebaseApp } from "@/utils/firebase";

let globalFcmToken: string | null = null;
export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(globalFcmToken);

  useEffect(() => {
    const initializeNotifications = async () => {
      // Initialize Firebase app
      try {
        getFirebaseApp();
        console.log("Firebase initialized in RootLayout");
      } catch (error) {
        console.error("Firebase initialization error:", error);
      }

      // Register for push notifications and get the push token
      registerForPushNotificationsAsync().then(async (token) => {
        if (token) {
          console.log("FCM Token:", token);
          setFcmToken(token); // Store the push token
          globalFcmToken = token; // Update the global token
        }
      });

      // const hasPermission = await requestPermission();
      // if (hasPermission) {
      //   const token = await messaging().getToken();
      //   console.log("FCM Token:", token);

      //   // Check if the token is already saved globally
      //   if (token && token !== globalFcmToken) {
      //     globalFcmToken = token; // Store in a global variable
      //     setFcmToken(token);

      //     // Save the token to the server
      //     try {
      //       await savePushToken(token);
      //     } catch (error) {
      //       console.error("Error saving push token:", error);
      //     }
      //   }
      // }
    };

    initializeNotifications();
    handleBackgroundNotifications();
    const unsubscribe = handleForegroundNotification();

    return () => {
      unsubscribe();
    };
  }, []);

  return { fcmToken };
};

export const getFcmToken = () => globalFcmToken;

export const useNotificationObserver = () => {
  useEffect(() => {
    const redirectToUrl = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (url) {
        router.push(url);
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) {
        redirectToUrl(response.notification);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirectToUrl(response.notification);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);
};
