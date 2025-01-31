const fs = require("fs-extra");
const path = require("path");

const packageName = "com.digitalnomad91.codebuilderadmin";

// Paths to Android files
const androidManifestPath = path.join(
  __dirname,
  "../android/app/src/main/AndroidManifest.xml"
);
const javaMainApplicationPath = path.join(
  __dirname,
  "../android/app/src/main/java/com/digitalnomad91/codebuilderadmin/MainApplication.java"
);
const kotlinMainApplicationPath = path.join(
  __dirname,
  "../android/app/src/main/java/com/digitalnomad91/codebuilderadmin/MainApplication.kt"
);
const javaHelperPath = path.join(
  __dirname,
  "../android/app/src/main/java/com/digitalnomad91/codebuilderadmin/BatteryOptimizationHelper.java"
);
const kotlinHelperPath = path.join(
  __dirname,
  "../android/app/src/main/java/com/digitalnomad91/codebuilderadmin/BatteryOptimizationHelper.kt"
);

// Determine whether the project uses Java or Kotlin
const isKotlin = fs.existsSync(kotlinMainApplicationPath);
const mainApplicationPath = isKotlin
  ? kotlinMainApplicationPath
  : javaMainApplicationPath;
const helperPath = isKotlin ? kotlinHelperPath : javaHelperPath;

console.log(`🔍 Detected ${isKotlin ? "Kotlin" : "Java"} project`);

// 🟢 1. Ensure `AndroidManifest.xml` has the required permission
const addPermissionToManifest = async () => {
  try {
    let manifest = await fs.readFile(androidManifestPath, "utf8");
    const permission =
      '<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />';

    // Ensure the permission is inside <manifest> but before <application>
    if (!manifest.includes(permission)) {
      manifest = manifest.replace(
        /<manifest[^>]*>/,
        (match) => `${match}\n    ${permission}`
      );

      await fs.writeFile(androidManifestPath, manifest, "utf8");
      console.log(
        "✅ Battery optimization permission added to AndroidManifest.xml"
      );
    } else {
      console.log(
        "🔹 Battery optimization permission already exists in AndroidManifest.xml"
      );
    }
  } catch (error) {
    console.error("❌ Error updating AndroidManifest.xml:", error);
  }
};

// 🟢 2. Create the `BatteryOptimizationHelper` module in either Java or Kotlin
const javaHelperCode = `
package com.digitalnomad91.codebuilderadmin;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class BatteryOptimizationHelper extends ReactContextBaseJavaModule {

    public BatteryOptimizationHelper(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "BatteryOptimizationHelper";
    }

    @ReactMethod
    public void autoHighlightApp() {
        try {
            Context context = getReactApplicationContext();
            Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            intent.setData(Uri.parse("package:${packageName}"));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`;

const kotlinHelperCode = `
package com.digitalnomad91.codebuilderadmin

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BatteryOptimizationHelper(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "BatteryOptimizationHelper"
    }

    @ReactMethod
    fun autoHighlightApp() {
        try {
            val context: Context = reactApplicationContext
            val packageName = context.packageName // ✅ FIX: Dynamically retrieve package name

            val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
            intent.data = Uri.parse("package:$packageName") // ✅ FIX: Use correct package name
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
`;

const createBatteryOptimizationHelper = async () => {
  try {
    const helperCode = isKotlin ? kotlinHelperCode : javaHelperCode;
    await fs.ensureFile(helperPath);
    await fs.writeFile(helperPath, helperCode, "utf8");
    console.log(
      `✅ BatteryOptimizationHelper.${isKotlin ? "kt" : "java"} created`
    );
  } catch (error) {
    console.error(
      `❌ Error creating BatteryOptimizationHelper.${
        isKotlin ? "kt" : "java"
      }:`,
      error
    );
  }
};

// 🟢 3. Modify `MainApplication` to register the new module
const modifyMainApplication = async () => {
  try {
    let mainApplication = await fs.readFile(mainApplicationPath, "utf8");
    const importStatement = `import com.digitalnomad91.codebuilderadmin.BatteryOptimizationHelper`;

    if (!mainApplication.includes(importStatement)) {
      mainApplication = mainApplication.replace(
        "import com.facebook.react.ReactPackage",
        `import com.facebook.react.ReactPackage\n${importStatement}`
      );
    }

    if (isKotlin) {
      const registerModule =
        "BatteryOptimizationHelper(reactNativeHost.reactInstanceManager.currentReactContext!!),";
      if (!mainApplication.includes(registerModule)) {
        mainApplication = mainApplication.replace(
          "packages = mutableListOf(",
          `packages = mutableListOf(\n        ${registerModule}`
        );
      }
    } else {
      const registerModule = "new BatteryOptimizationHelper(),";
      if (!mainApplication.includes(registerModule)) {
        mainApplication = mainApplication.replace(
          "new MainReactPackage(),",
          `new MainReactPackage(),\n        ${registerModule}`
        );
      }
    }

    await fs.writeFile(mainApplicationPath, mainApplication, "utf8");
    console.log(
      `✅ BatteryOptimizationHelper registered in MainApplication.${
        isKotlin ? "kt" : "java"
      }`
    );
  } catch (error) {
    console.error(
      `❌ Error updating MainApplication.${isKotlin ? "kt" : "java"}:`,
      error
    );
  }
};

// Run all steps
(async () => {
  console.log("🚀 Setting up battery optimization exemption...");
  await addPermissionToManifest();
  await createBatteryOptimizationHelper();
  await modifyMainApplication();
  console.log("🎉 Battery optimization setup complete!");
})();
