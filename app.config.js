// Converted to CommonJS-only so build scripts can safely require this file
// (previous ESM import of JSON caused: needs an import attribute of "type: json")
const dotenv = require('dotenv');
const withNotificationToolsReplace = require('./plugins/test.cjs');
// Use require for JSON to avoid ESM assertion issues in Node scripts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const versionData = require('./version.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');

// Explicitly load the .env file
dotenv.config();

// Add this new plugin
const withIOSSounds = (config) => {
    return withXcodeProject(config, async (cfg) => {
        const xcodeProject = cfg.modResults;
        const appName = 'CodeBuilder Admin'; // Match your iOS project name
        const soundFiles = fs.readdirSync(`./ios/${appName}/Sounds`);

        soundFiles.forEach((file) => {
            xcodeProject.addResourceFile({
                path: `${appName}/Sounds/${file}`,
                group: 'Resources',
            });
        });

        return cfg;
    });
};

module.exports = {
    expo: {
        name: 'CodeBuilder Admin',
        slug: 'codebuilder',
        version: versionData.version, // Using version from version.json
        extra: {
            buildDate: process.env.BUILD_DATE || new Date().toISOString(),
            eas: {
                projectId: 'c382aeb5-b138-47fb-83b4-dc45ab02ce76',
            },
            firebaseApiKey: process.env.FIREBASE_API_KEY,
            firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
            firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
            firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            firebaseAppId: process.env.FIREBASE_APP_ID,
            googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            googleWebClientIdDev: process.env.GOOGLE_WEB_CLIENT_ID_DEV || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID_DEV,
        },
        orientation: 'portrait',
        icon: './assets/images/icon.png',
        scheme: 'codebuilder-admin',
        userInterfaceStyle: 'automatic',
        newArchEnabled: true,
        notification: {
            icon: './assets/images/icon.png',
            color: '#ffffff', // Optional: Tint color for the icon
        },
        splash: {
            image: './assets/images/splash-icon.png',
            resizeMode: 'contain',
            backgroundColor: '#000000',
        },
        androidStatusBar: {
            barStyle: 'light-content',
            backgroundColor: '#000000',
            translucent: false,
        },
        ios: {
            buildNumber: versionData.iosBuildNumber, // Using iOS build number from version.json
            supportsTablet: true,
            bundleIdentifier: 'com.digitalnomad91.codebuilderadmin',
            googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
            entitlements: {
                'aps-environment': 'production',
            },
            config: {
                // Provide your Google Maps API key
                googleMapsApiKey: 'YOUR_IOS_GOOGLE_MAPS_API_KEY',
            },
        },
        android: {
            versionCode: versionData.androidVersionCode, // Using Android versionCode from version.json
            adaptiveIcon: {
                foregroundImage: './assets/images/adaptive-icon.png',
                backgroundColor: '#ffffff',
            },
            package: 'com.digitalnomad91.codebuilderadmin',
            permissions: ['NOTIFICATIONS', 'POST_NOTIFICATIONS', 'READ_PHONE_STATE'],
            googleServicesFile: './google-services.json',
            useNextNotificationsApi: true,
            notification: {
                icon: './assets/images/icon.png',
                color: '#ffffff', // Optional: Tint color for the icon
            },
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            },
            manifest: {
              application: {
                metaData: [
                  {
                    "android:name": "com.google.firebase.messaging.default_notification_color",
                    "android:resource": "@color/notification_icon_color",
                    "tools:replace": "android:resource",
                  },
                ],
              },
            },
        },
        web: {
            bundler: 'metro',
            output: 'web-build',
            favicon: './assets/images/favicon.png',
        },
        plugins: [
            withNotificationToolsReplace,
            [
                'expo-camera',
                {
                    cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera',
                    microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone',
                    recordAudioAndroid: true,
                },
            ],
            'expo-router',
            [
                'expo-build-properties',
                {
                    newArchEnabled: false,
                    ios: {
                        flipper: false,
                        useFrameworks: 'static',
                    },
                    android: {
                        compileSdkVersion: 35,
                        targetSdkVersion: 35,
                        buildToolsVersion: '35.0.0',
                    },
                },
            ],
            '@react-native-firebase/app',
            '@react-native-firebase/messaging',
            '@react-native-google-signin/google-signin',
            // Add the iOS sound plugin
            [withIOSSounds],
            [
                'expo-notifications',
                {
                    sounds: ['./assets/sounds/notification.aiff'],
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
            reactCanary: true,
        },
    },
};
