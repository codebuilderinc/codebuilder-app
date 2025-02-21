const path = require("path");
const fs = require("fs");

const androidBasePath = path.join(__dirname, "../android/app/src/main");
const kotlinBasePath = path.join(
  androidBasePath,
  "java/com/digitalnomad91/codebuilderadmin"
);

const androidManifestPath = path.join(androidBasePath, "AndroidManifest.xml");
const mainActivityPath = path.join(kotlinBasePath, "MainActivity.kt");
const servicePath = path.join(kotlinBasePath, "ScreenRecordService.kt");

const ensurePermissions = () => {
  if (!fs.existsSync(androidManifestPath)) {
    console.error("❌ AndroidManifest.xml not found");
    return;
  }

  let manifestContent = fs.readFileSync(androidManifestPath, "utf8");
  const requiredPermissions = [
    "android.permission.RECORD_AUDIO",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.MEDIA_PROJECTION",
  ];

  let modified = false;
  requiredPermissions.forEach((permission) => {
    if (!manifestContent.includes(permission)) {
      manifestContent = manifestContent.replace(
        "</manifest>",
        `    <uses-permission android:name="${permission}" />\n</manifest>`
      );
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(androidManifestPath, manifestContent, "utf8");
    console.log("✅ AndroidManifest.xml permissions updated");
  } else {
    console.log("✅ AndroidManifest.xml has required permissions");
  }
};

const ensureMainActivityModifications = () => {
  if (!fs.existsSync(mainActivityPath)) {
    console.error("❌ MainActivity.kt not found");
    return;
  }

  let content = fs.readFileSync(mainActivityPath, "utf8");

  // Clean up duplicate imports
  const importsToManage = [
    "android.os.Bundle",
    "android.content.Context",
    "android.content.Intent",
    "android.media.projection.MediaProjectionManager",
  ];

  importsToManage.forEach((imp) => {
    const importRegex = new RegExp(`import ${imp}[\n\r]`, "g");
    if ((content.match(importRegex) || []).length > 1) {
      content = content.replace(importRegex, "");
      content = `import ${imp}\n${content}`;
    }
  });

  // Ensure required imports exist
  const requiredImports = `
import android.os.Bundle
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
  `.trim();

  if (!content.includes("MediaProjectionManager")) {
    content = content.replace(
      /import com\.facebook\.react\.ReactActivity/,
      `import com.facebook.react.ReactActivity\n${requiredImports}`
    );
  }

  // Injection code with null safety and proper overrides
  const injectionCode = `
    private val SCREEN_RECORD_REQUEST_CODE = 1001
    private lateinit var projectionManager: MediaProjectionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    }

    fun startScreenRecording() {
        val captureIntent = projectionManager.createScreenCaptureIntent()
        startActivityForResult(captureIntent, SCREEN_RECORD_REQUEST_CODE)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == SCREEN_RECORD_REQUEST_CODE && data != null) {
            Intent(this, ScreenRecordService::class.java).apply {
                putExtra("RESULT_CODE", resultCode)
                putExtra("DATA", data)
                startForegroundService(this)
            }
        }
    }
  `.trim();

  if (!content.includes("SCREEN_RECORD_REQUEST_CODE")) {
    // Remove any existing duplicate code
    const duplicateCodePatterns = [
      /private val SCREEN_RECORD_REQUEST_CODE = \d+/,
      /override fun onCreate\(.*?\)\s*\{[\s\S]*?\}/,
      /fun startScreenRecording\(\)\s*\{[\s\S]*?\}/,
      /override fun onActivityResult\(.*?\)\s*\{[\s\S]*?\}/,
    ];

    duplicateCodePatterns.forEach((pattern) => {
      content = content.replace(pattern, "");
    });

    // Insert new code
    content = content.replace(
      /class MainActivity : ReactActivity\(\)\s*\{/,
      `class MainActivity : ReactActivity() {\n${injectionCode}\n`
    );

    fs.writeFileSync(mainActivityPath, content, "utf8");
    console.log("✅ MainActivity.kt updated with proper implementations");
  } else {
    console.log("✅ MainActivity already contains correct code");
  }
};

const ensureScreenRecordService = () => {
  if (!fs.existsSync(kotlinBasePath)) {
    fs.mkdirSync(kotlinBasePath, { recursive: true });
  }

  if (!fs.existsSync(servicePath)) {
    const serviceCode = `package com.digitalnomad91.codebuilderadmin

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.digitalnomad91.codebuilderadmin.R

class ScreenRecordService : Service() {
    companion object {
        const val CHANNEL_ID = "ScreenRecorderChannel"
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        startForeground(1, createNotification())
        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Recording",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Recording screen activity"
            }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Screen Recording")
            .setContentText("Recording in progress")
            .setSmallIcon(R.mipmap.ic_launcher_foreground)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`;
    fs.writeFileSync(servicePath, serviceCode, "utf8");
    console.log("✅ ScreenRecordService.kt created");
  } else {
    console.log("✅ ScreenRecordService.kt exists");
  }
};

// Execute all steps with error handling
try {
  console.log("\n🚀 Starting screen recording setup...");
  ensurePermissions();
  ensureMainActivityModifications();
  ensureScreenRecordService();
  console.log("🎉 Screen recording setup completed successfully!\n");
} catch (error) {
  console.error("\n❌ Setup failed:", error.message);
  process.exit(1);
}
