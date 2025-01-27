const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Custom Expo plugin to resolve manifest conflicts with Firebase Messaging.
 * Specifically, this plugin ensures that the meta-data for
 * `com.google.firebase.messaging.default_notification_color` is correctly
 * configured with `tools:replace="android:resource"` to prevent build errors.
 */
module.exports = function withNotificationToolsReplace(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Ensure the namespace 'tools' is added to the manifest to support 'tools:replace' attributes
    if (!androidManifest.manifest.$["xmlns:tools"]) {
      androidManifest.manifest.$["xmlns:tools"] =
        "http://schemas.android.com/tools";
    }

    const application = androidManifest.manifest.application[0];
    application["meta-data"] ??= []; // Ensure 'meta-data' exists in the application node

    // Check if the meta-data for `default_notification_color` already exists
    const metaData = application["meta-data"].find(
      (item) =>
        item["$"]["android:name"] ===
        "com.google.firebase.messaging.default_notification_color"
    );

    if (metaData) {
      // If it exists, add or update the 'tools:replace' attribute to resolve conflicts
      metaData["$"]["tools:replace"] = "android:resource";
    } else {
      // If it does not exist, create the meta-data entry with the required attributes
      application["meta-data"].push({
        $: {
          "android:name":
            "com.google.firebase.messaging.default_notification_color",
          "android:resource": "@color/notification_icon_color",
          "tools:replace": "android:resource",
        },
      });
    }

    // Return the updated config
    return config;
  });
};
