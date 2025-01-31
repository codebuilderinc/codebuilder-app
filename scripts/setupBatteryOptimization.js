const fs = require("fs-extra");
const path = require("path");

const packageName = "com.digitalnomad91.codebuilderadmin";

// Paths to Android files
const androidManifestPath = path.join(
  __dirname,
  "../android/app/src/main/AndroidManifest.xml"
);
const kotlinMainApplicationPath = path.join(
  __dirname,
  "../android/app/src/main/java/com/digitalnomad91/codebuilderadmin/MainApplication.kt"
);
const kotlinHelperPath = path.join(
  __dirname,
  "../android/app/src/main/java/com/digitalnomad91/codebuilderadmin/BatteryOptimizationHelper.kt"
);

// Check if the app uses Kotlin
const mainApplicationPath = kotlinMainApplicationPath;
const helperPath = kotlinHelperPath;

console.log("🔍 Detected Kotlin project");

// 🟢 1. Ensure `AndroidManifest.xml` has the required permission
const addPermissionToManifest = async () => {
  try {
    let manifest = await fs.readFile(androidManifestPath, "utf8");
    const permission =
      '<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />';

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

// 🟢 2. Create `BatteryOptimizationHelper.kt` with improved logic
const kotlinHelperCode = `
package ${packageName}

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.util.Log
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class BatteryOptimizationHelper(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "BatteryOptimizationHelper"
    }

    @ReactMethod
    fun autoHighlightApp() {
        try {
            val context: Context = reactApplicationContext
            val packageName = context.packageName

            Log.d("BatteryOptimizationHelper", "Opening battery optimization settings for " + packageName)

            // First, try opening the specific battery optimization settings
            val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
            intent.data = Uri.parse("package:" + packageName)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                Log.d("BatteryOptimizationHelper", "Battery optimization settings opened!")
            } else {
                // If direct setting fails, open general battery settings instead
                Log.e("BatteryOptimizationHelper", "Could not resolve activity for battery optimization settings! Trying general battery settings...")
                val generalIntent = Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS)
                generalIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

                if (generalIntent.resolveActivity(context.packageManager) != null) {
                    context.startActivity(generalIntent)
                    Log.d("BatteryOptimizationHelper", "General battery settings opened!")
                } else {
                    Log.e("BatteryOptimizationHelper", "Could not resolve activity for general battery settings!")
                }
            }
        } catch (e: Exception) {
            Log.e("BatteryOptimizationHelper", "Error opening battery settings: " + e.message, e)
        }
    }
}

class BatteryOptimizationPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(BatteryOptimizationHelper(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

const createBatteryOptimizationHelper = async () => {
  try {
    await fs.ensureFile(helperPath);
    await fs.writeFile(helperPath, kotlinHelperCode, "utf8");
    console.log("✅ BatteryOptimizationHelper.kt created");
  } catch (error) {
    console.error("❌ Error creating BatteryOptimizationHelper.kt:", error);
  }
};

// 🟢 3. Modify `MainApplication.kt` to register the module correctly
const modifyMainApplication = async () => {
  try {
    let mainApplication = await fs.readFile(mainApplicationPath, "utf8");
    const importStatement = `import ${packageName}.BatteryOptimizationPackage`;

    if (!mainApplication.includes(importStatement)) {
      mainApplication = mainApplication.replace(
        "import com.facebook.react.ReactPackage",
        `import com.facebook.react.ReactPackage\n${importStatement}`
      );
    }

    // ✅ Detect Expo’s New Architecture
    const isNewArch = mainApplication.includes("DefaultReactNativeHost");

    if (isNewArch) {
      console.log(
        "🔍 Detected Expo New Architecture. Adjusting `MainApplication.kt`..."
      );

      const registerModule = "BatteryOptimizationPackage()";

      if (!mainApplication.includes(registerModule)) {
        mainApplication = mainApplication.replace(
          /val packages = PackageList\(this\)\.packages/,
          `val packages = PackageList(this).packages.toMutableList()\n            packages.add(${registerModule})`
        );
      }
    }

    await fs.writeFile(mainApplicationPath, mainApplication, "utf8");
    console.log(
      "✅ BatteryOptimizationPackage registered in MainApplication.kt"
    );
  } catch (error) {
    console.error("❌ Error updating MainApplication.kt:", error);
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
