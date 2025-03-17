import { initializeApp, getApp, FirebaseApp } from "firebase/app";
import Constants from "expo-constants";

let firebaseApp: FirebaseApp | undefined;

/**
 * Initializes and retrieves the Firebase app instance.
 */
export function getFirebaseApp(): FirebaseApp {
  const config = Constants.expoConfig?.extra;

  if (!config) {
    throw new Error("Firebase configuration is missing.");
  }

  if (!firebaseApp) {
    try {
      firebaseApp = getApp(); // Checks if the app is already initialized
      console.log("Firebase already initialized");
    } catch {
      firebaseApp = initializeApp({
        apiKey: config.eas.firebaseApiKey,
        authDomain: config.eas.firebaseAuthDomain,
        projectId: config.eas.firebaseProjectId,
        storageBucket: config.eas.firebaseStorageBucket,
        messagingSenderId: config.eas.firebaseMessagingSenderId,
        appId: config.eas.firebaseAppId,
      });
      console.log("Firebase initialized");
    }
  }

  return firebaseApp;
}
