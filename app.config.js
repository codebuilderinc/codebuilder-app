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
            infoPlist: {
                NSCameraUsageDescription: 'Allow CodeBuilder Admin to access the camera for capturing photos and video.',
                NSMicrophoneUsageDescription: 'Allow CodeBuilder Admin to access the microphone for calls, audio, and video capture.',
                NSPhotoLibraryUsageDescription: 'Allow CodeBuilder Admin to access your photo library to select media.',
                NSPhotoLibraryAddUsageDescription: 'Allow CodeBuilder Admin to save photos or videos to your library.',
                NSLocationWhenInUseUsageDescription: 'Allow CodeBuilder Admin to access your location while using the app.',
                NSLocationAlwaysAndWhenInUseUsageDescription: 'Allow CodeBuilder Admin to access your location even when the app is not active.',
                NSCalendarsUsageDescription: 'Allow CodeBuilder Admin to access your calendars.',
                NSContactsUsageDescription: 'Allow CodeBuilder Admin to access your contacts.',
                NSBluetoothAlwaysUsageDescription: 'Allow CodeBuilder Admin to use Bluetooth for nearby devices.',
                NSBluetoothPeripheralUsageDescription: 'Allow CodeBuilder Admin to use Bluetooth peripherals.',
                NSMotionUsageDescription: 'Allow CodeBuilder Admin to access motion data.',
                NSSpeechRecognitionUsageDescription: 'Allow CodeBuilder Admin to transcribe speech.',
                NSFaceIDUsageDescription: 'Allow CodeBuilder Admin to use Face ID for authentication.',
                NSUserTrackingUsageDescription: 'Allow CodeBuilder Admin to track activity for personalized experiences.',
            },
        },
        android: {
            versionCode: versionData.androidVersionCode, // Using Android versionCode from version.json
            adaptiveIcon: {
                foregroundImage: './assets/images/adaptive-icon.png',
                backgroundColor: '#ffffff',
            },
            package: 'com.digitalnomad91.codebuilderadmin',
            permissions: [
                'ACCEPT_HANDOVER',
                'ACCESS_BACKGROUND_LOCATION',
                'ACCESS_COARSE_LOCATION',
                'ACCESS_FINE_LOCATION',
                'ACCESS_MEDIA_LOCATION',
                'ACCESS_NETWORK_STATE',
                'ACCESS_NOTIFICATION_POLICY',
                'ACCESS_WIFI_STATE',
                'ACTIVITY_RECOGNITION',
                'ADD_VOICEMAIL',
                'ANSWER_PHONE_CALLS',
                'AUTHENTICATE_ACCOUNTS',
                'BLUETOOTH',
                'BLUETOOTH_ADMIN',
                'BLUETOOTH_ADVERTISE',
                'BLUETOOTH_CONNECT',
                'BLUETOOTH_SCAN',
                'BODY_SENSORS',
                'BODY_SENSORS_BACKGROUND',
                'CALL_PHONE',
                'CAMERA',
                'CHANGE_NETWORK_STATE',
                'CHANGE_WIFI_MULTICAST_STATE',
                'CHANGE_WIFI_STATE',
                'FOREGROUND_SERVICE',
                'FOREGROUND_SERVICE_CAMERA',
                'FOREGROUND_SERVICE_CONNECTED_DEVICE',
                'FOREGROUND_SERVICE_DATA_SYNC',
                'FOREGROUND_SERVICE_HEALTH',
                'FOREGROUND_SERVICE_LOCATION',
                'FOREGROUND_SERVICE_MEDIA_PLAYBACK',
                'FOREGROUND_SERVICE_MICROPHONE',
                'FOREGROUND_SERVICE_PHONE_CALL',
                'FOREGROUND_SERVICE_REMOTE_MESSAGING',
                'GET_ACCOUNTS',
                'INTERNET',
                'KILL_BACKGROUND_PROCESSES',
                'MANAGE_EXTERNAL_STORAGE',
                'MODIFY_AUDIO_SETTINGS',
                'NEARBY_WIFI_DEVICES',
                'NFC',
                'NFC_TRANSACTION_EVENT',
                'NOTIFICATIONS',
                'PACKAGE_USAGE_STATS',
                'POST_NOTIFICATIONS',
                'PROCESS_OUTGOING_CALLS',
                'QUERY_ALL_PACKAGES',
                'READ_CALENDAR',
                'WRITE_CALENDAR',
                'READ_CALL_LOG',
                'WRITE_CALL_LOG',
                'READ_CONTACTS',
                'WRITE_CONTACTS',
                'READ_EXTERNAL_STORAGE',
                'WRITE_EXTERNAL_STORAGE',
                'READ_MEDIA_AUDIO',
                'READ_MEDIA_IMAGES',
                'READ_MEDIA_VIDEO',
                'READ_MEDIA_VISUAL_USER_SELECTED',
                'READ_PHONE_NUMBERS',
                'READ_PHONE_STATE',
                'READ_PRECISE_PHONE_STATE',
                'READ_PROFILE',
                'READ_SMS',
                'RECEIVE_BOOT_COMPLETED',
                'RECEIVE_MMS',
                'RECEIVE_SMS',
                'RECEIVE_WAP_PUSH',
                'RECORD_AUDIO',
                'REORDER_TASKS',
                'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
                'REQUEST_INSTALL_PACKAGES',
                'SCHEDULE_EXACT_ALARM',
                'SEND_SMS',
                'SET_WALLPAPER',
                'SET_WALLPAPER_HINTS',
                'SYSTEM_ALERT_WINDOW',
                'USE_BIOMETRIC',
                'USE_CREDENTIALS',
                'USE_FULL_SCREEN_INTENT',
                'USE_FINGERPRINT',
                'USE_SIP',
                'VIBRATE',
                'WAKE_LOCK',
                'WRITE_SYNC_SETTINGS',
                'READ_SYNC_SETTINGS',
                'READ_SYNC_STATS',
            ],
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
                            'android:name': 'com.google.firebase.messaging.default_notification_color',
                            'android:resource': '@color/notification_icon_color',
                            'tools:replace': 'android:resource',
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
            [
                '@sentry/react-native/expo',
                {
                    url: 'https://sentry.io/',
                    project: 'codebuilder-app',
                    organization: 'codebuilder',
                },
            ],
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
