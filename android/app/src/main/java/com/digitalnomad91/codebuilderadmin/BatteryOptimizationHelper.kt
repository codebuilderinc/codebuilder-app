
package com.digitalnomad91.codebuilderadmin

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
