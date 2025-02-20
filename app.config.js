import dotenv from "dotenv";
import withNotificationToolsReplace from "./plugins/test.cjs";
import versionData from "./version.json"; // Import version info

// Explicitly load the .env file
dotenv.config();

module.exports = {
  expo: {
    name: "CodeBuilder Admin",
    slug: "codebuilder",
    version: versionData.version, // Using version from version.json
    extra: {
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      eas: {
        projectId: "c382aeb5-b138-47fb-83b4-dc45ab02ce76",
      },
      firebaseApiKey: process.env.FIREBASE_API_KEY,s
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
    },
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    notification: {
      icon: "./assets/images/icon.png",
      color: "#ffffff", // Optional: Tint color for the icon
    },
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      buildNumber: versionData.iosBuildNumber, // Using iOS build number from version.json
      supportsTablet: true,
      bundleIdentifier: "com.digitalnomad91.codebuilderadmin",
      googleServicesFile: "./GoogleService-Info.plist",
      entitlements: {
        "aps-environment": "production",
      },
      config: {
        // Provide your Google Maps API key
        googleMapsApiKey: "YOUR_IOS_GOOGLE_MAPS_API_KEY",
      },
    },
    android: {
      versionCode: versionData.androidVersionCode, // Using Android versionCode from version.json
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.digitalnomad91.codebuilderadmin",
      permissions: ["NOTIFICATIONS", "POST_NOTIFICATIONS"],
      googleServicesFile: "./google-services.json",
      useNextNotificationsApi: true,
      notification: {
        icon: "./assets/images/icon.png",
        color: "#ffffff", // Optional: Tint color for the icon
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      // manifest: {
      //   application: {
      //     metaData: [
      //       {
      //         "android:name": "com.google.firebase.messaging.default_notification_color",
      //         "android:resource": "@color/notification_icon_color",
      //         "tools:replace": "android:resource",
      //       },
      //     ],
      //   },
      // },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.ico",
    },
    plugins: [
      withNotificationToolsReplace,
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true,
        },
      ],
      "expo-router",
      [
        "expo-build-properties",
        {
          newArchEnabled: false,
          ios: {
            flipper: false,
            useFrameworks: "static",
          },
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
          },
        },
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
