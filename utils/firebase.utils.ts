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
        apiKey: config.firebaseApiKey,
        authDomain: config.firebaseAuthDomain,
        projectId: config.firebaseProjectId,
        storageBucket: config.firebaseStorageBucket,
        messagingSenderId: config.firebaseMessagingSenderId,
        appId: config.firebaseAppId,
      });
      console.log("Firebase initialized");
    }
  }

  return firebaseApp;
}
