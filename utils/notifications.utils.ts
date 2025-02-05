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
        sound: "default", // Enable sound
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

// Handle foreground notifications
export const handleForegroundNotification = () => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log("Foreground message received:", remoteMessage);

    // (Optional) Show an in-app alert:
    // Alert.alert(
    //   "New notification",
    //   JSON.stringify(remoteMessage.notification)
    // );

    // Show a *local* system notification so the user sees a banner or heads-up:
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification?.title ?? "New Notification",
        body: remoteMessage.notification?.body ?? "You received a new message",
        // You can include other fields like sound, badge, data, etc.
      },
      trigger: null, // null = show now (immediately)
    });
  });
  return unsubscribe;
};

// DEPRACATED
// export const handleForegroundNotification = () => {
//   return messaging().onMessage(async (remoteMessage) => {
//     await handleNotification(remoteMessage);
//   });
// };

// Handle background & quit-state notifications
export const handleBackgroundNotifications = () => {
  // Handle background notifications handler.
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("Background message received:", remoteMessage);
  });

  // Handle notification opened when app is in background
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("Notification opened from background:", remoteMessage);
  });

  // Handle notification opened when app is in quit state
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
      "https://new.codebuilder.org/api/notifications/subscribe",
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
      body: "This is a test notification.",
      sound: true,
      data: { extraData: "Some data" },
    },
    trigger: null, // Send immediately
  });
}

/**
 * DEPRACATED
 * DEPRACATED
 * DEPRACATED
 */

// // export const requestAndroidNotificationPermission =
// //   async (): Promise<boolean> => {
// //     if (Platform.OS === "android" && Platform.Version >= 33) {
// //       const hasPermission = await PermissionsAndroid.check(
// //         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
// //       );

// //       if (!hasPermission) {
// //         const granted = await PermissionsAndroid.request(
// //           PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
// //         );
// //         return granted === PermissionsAndroid.RESULTS.GRANTED;
// //       }
// //     }
// //     return true;
// //   };

// //   // DEPRACATED
// // export const requestPermission = async (): Promise<boolean> => {
// //   const androidPermission = await requestAndroidNotificationPermission();
// //   const authStatus = await messaging().requestPermission();
// //   const isAuthorized =
// //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
// //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

// //   if (!androidPermission || !isAuthorized) {
// //     console.warn("Push notification permissions are not granted.");
// //     return false;
// //   }
// //   return true;
// // };
// export const usePushNotifications = () => {
//   // Set up listeners and request permission on mount
//   useEffect(() => {
//     (async () => {
//       const hasPermission = await requestPermission();
//       if (hasPermission) {
//         await getToken();
//       }
//     })();

//     handleBackgroundNotifications();
//     const unsubscribe = handleForegroundNotification();

//     return () => {
//       unsubscribe();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Request permissions for push notifications
//   const requestPermission = async () => {
//     // Android 13+ requires POST_NOTIFICATIONS permission
//     if (Platform.OS === "android" && Platform.Version >= 33) {
//       const hasPermission = await PermissionsAndroid.check(
//         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//       );

//       if (!hasPermission) {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//         );

//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           console.warn("Push notification permissions are not granted.");
//           return false;
//         }
//       }
//     }

//     const authStatus = await messaging().requestPermission();
//     const isAuthorized =
//       authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//       authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//     if (!isAuthorized) {
//       console.warn("Push notification permissions are not granted.");
//     }
//     return isAuthorized;
//   };

//   // Get the push token from FCM (and APNs on iOS)
//   const getToken = async () => {
//     try {
//       if (Platform.OS === "ios") {
//         const apnsToken = await messaging().getAPNSToken();
//         if (!apnsToken) {
//           console.warn("APNs token is null. Check APNs setup.");
//           return;
//         }
//         console.log("APNs Token:", apnsToken);
//       }

//       const fcmToken = await messaging().getToken();
//       console.log("FCM Token:", fcmToken);

//       await saveTokenToServer(fcmToken);
//       return fcmToken;
//     } catch (error) {
//       console.error("Error fetching push notification token:", error);
//     }
//   };

//   // Handle foreground notifications
//   const handleForegroundNotification = () => {
//     const unsubscribe = messaging().onMessage(async (remoteMessage) => {
//       console.log("Foreground message received:", remoteMessage);

//       // (Optional) Show an in-app alert:
//       Alert.alert(
//         "New notification",
//         JSON.stringify(remoteMessage.notification)
//       );

//       // Show a *local* system notification so the user sees a banner or heads-up:
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: remoteMessage.notification?.title ?? "New Notification",
//           body:
//             remoteMessage.notification?.body ?? "You received a new message",
//           // You can include other fields like sound, badge, data, etc.
//         },
//         trigger: null, // null = show now (immediately)
//       });
//     });
//     return unsubscribe;
//   };

//   // Handle background & quit-state notifications
//   const handleBackgroundNotifications = () => {
//     // Handle background notifications handler.
//     messaging().setBackgroundMessageHandler(async (remoteMessage) => {
//       console.log("Background message received:", remoteMessage);
//     });

//     // Handle notification opened when app is in background
//     messaging().onNotificationOpenedApp((remoteMessage) => {
//       console.log("Notification opened from background:", remoteMessage);
//     });

//     // Handle notification opened when app is in quit state
//     messaging()
//       .getInitialNotification()
//       .then((remoteMessage) => {
//         if (remoteMessage) {
//           console.log("Notification opened from quit state:", remoteMessage);
//         }
//       });
//   };
// };

// // Example function to trigger a local notification
// export async function triggerLocalSampleNotification() {
//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title: "Job Notification",
//       body: "This is a test notification.",
//       sound: true,
//       data: { extraData: "Some data" },
//     },
//     trigger: null, // Send immediately
//   });
// }

// /* Save the push token to your backend.*/
// export async function saveTokenToServer(token: string) {
//   try {
//     await fetch("https://new.codebuilder.org/api/subscribe", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         endpoint: "https://fcm.googleapis.com/fcm/send",
//         keys: { token },
//         type: "fcm",
//       }),
//     });
//     console.log("Push token saved to server successfully.");
//   } catch (error) {
//     console.error("Error saving token to server:", error);
//   }
// }

// // Register for push notifications on both Android & iOS (Expo + Firebase)
// export async function registerForPushNotificationsAsync__DEPRACATED() {
//   if (!Device.isDevice) {
//     console.warn("Push notifications require a physical device.");
//     return null;
//   }

//   try {
//     // Android notification channel setup
//     if (Platform.OS === "android") {
//       await Notifications.setNotificationChannelAsync("default", {
//         name: "default",
//         importance: Notifications.AndroidImportance.MAX,
//       });
//     }

//     // Request Expo notification permissions
//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     // If permissions have not been granted, request them
//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     // If permissions are still not granted, exit
//     if (finalStatus !== "granted") {
//       Alert.alert("Permission for push notifications is not granted!");
//       return null;
//     }

//     // Get device push token via Expo
//     const result = await Notifications.getDevicePushTokenAsync();
//     const token = result.data;

//     console.log("Expo Push Token:", token);

//     // Save the token to server via API
//     if (token) {
//       await saveTokenToServer(token);
//     }

//     return token;
//   } catch (error) {
//     console.error("Error fetching push token:", error);
//     return null;
//   }
// }

// // Hook to observe notification responses (deep-linking, etc.)
// export function useNotificationObserver() {
//   useEffect(() => {
//     let isMounted = true;

//     // Redirect to a URL when a notification is tapped
//     function redirect(notification: Notifications.Notification) {
//       const url = notification.request.content.data?.url;
//       if (url) {
//         router.push(url);
//       }
//     }

//     // Handle if the app was opened from a notification
//     Notifications.getLastNotificationResponseAsync().then((response) => {
//       if (!isMounted || !response?.notification) return;
//       redirect(response.notification);
//     });

//     // Listen for new notification responses
//     const subscription = Notifications.addNotificationResponseReceivedListener(
//       (response) => {
//         redirect(response.notification);
//       }
//     );

//     // Clean up
//     return () => {
//       isMounted = false;
//       subscription.remove();
//     };
//   }, []);
// }
