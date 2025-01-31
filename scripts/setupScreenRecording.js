const path = require("path");
const fs = require("fs");

const androidBasePath = path.join(__dirname, "../android/app/src/main");
const javaOrKotlinBasePath = path.join(
  androidBasePath,
  "java/com/digitalnomad91/codebuilderadmin"
);

const androidManifestPath = path.join(androidBasePath, "AndroidManifest.xml");
const mainActivityPathKotlin = path.join(
  javaOrKotlinBasePath,
  "MainActivity.kt"
);
const serviceKotlinPath = path.join(
  javaOrKotlinBasePath,
  "ScreenRecordService.kt"
);

// Clean up potential duplicate in old java directory
const oldJavaServicePath = path.join(
  androidBasePath,
  "java/com/digitalnomad91/codebuilderadmin/ScreenRecordService.kt"
);
if (fs.existsSync(oldJavaServicePath)) {
  fs.unlinkSync(oldJavaServicePath);
  console.log("🧹 Removed duplicate service file from java directory");
}

const ensurePermissions = () => {
  if (!fs.existsSync(androidManifestPath)) {
    console.error("AndroidManifest.xml not found.");
    return;
  }

  let manifestContent = fs.readFileSync(androidManifestPath, "utf8");
  const permissions = [
    "android.permission.RECORD_AUDIO",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.MEDIA_PROJECTION",
  ];

  let modified = false;
  permissions.forEach((permission) => {
    if (!manifestContent.includes(permission)) {
      manifestContent = manifestContent.replace(
        "</manifest>",
        `    <uses-permission android:name="${permission}"/>\n</manifest>`
      );
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(androidManifestPath, manifestContent, "utf8");
    console.log("✅ AndroidManifest.xml updated with permissions.");
  } else {
    console.log("✅ AndroidManifest.xml has necessary permissions.");
  }
};

const ensureMainActivityModifications = () => {
  if (!fs.existsSync(mainActivityPathKotlin)) {
    console.error("❌ MainActivity.kt not found.");
    return;
  }

  let content = fs.readFileSync(mainActivityPathKotlin, "utf8");
  const injectionCode = `
    private val SCREEN_RECORD_REQUEST_CODE = 1001
    private var projectionManager: MediaProjectionManager? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    }

    fun startScreenRecording() {
        val intent = projectionManager?.createScreenCaptureIntent()
        startActivityForResult(intent, SCREEN_RECORD_REQUEST_CODE)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == SCREEN_RECORD_REQUEST_CODE) {
            val serviceIntent = Intent(this, ScreenRecordService::class.java)
            serviceIntent.putExtra("RESULT_CODE", resultCode)
            serviceIntent.putExtra("DATA", data)
            startForegroundService(serviceIntent)
        }
    }
    `;

  // Add imports if missing
  if (
    !content.includes("import android.media.projection.MediaProjectionManager")
  ) {
    content = content.replace(
      "import com.facebook.react.ReactActivity",
      `import com.facebook.react.ReactActivity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Bundle`
    );
  }

  if (!content.includes("SCREEN_RECORD_REQUEST_CODE")) {
    content = content.replace(
      /class MainActivity : ReactActivity\(\) \{/,
      `class MainActivity : ReactActivity() {${injectionCode}`
    );
    fs.writeFileSync(mainActivityPathKotlin, content, "utf8");
    console.log("✅ MainActivity.kt updated.");
  } else {
    console.log("✅ MainActivity already modified.");
  }
};

const ensureScreenRecordService = () => {
  const serviceDir = path.dirname(serviceKotlinPath);
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
    console.log("✅ Created service directory");
  }

  if (!fs.existsSync(serviceKotlinPath)) {
    const serviceCode = `package com.digitalnomad91.codebuilderadmin

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.projection.MediaProjection
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.digitalnomad91.codebuilderadmin.R

class ScreenRecordService : Service() {
    private val CHANNEL_ID = "ScreenRecordChannel"
    private var mediaProjection: MediaProjection? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotification()
        return START_STICKY
    }

    private fun createNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Recording",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Screen Recording")
            .setContentText("Your screen is being recorded")
            .setSmallIcon(R.mipmap.ic_launcher_foreground)
            .build()

        startForeground(1, notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`;
    fs.writeFileSync(serviceKotlinPath, serviceCode, "utf8");
    console.log("✅ ScreenRecordService.kt created.");
  } else {
    console.log("✅ ScreenRecordService.kt exists.");
  }
};

// Execute all steps
try {
  ensurePermissions();
  ensureMainActivityModifications();
  ensureScreenRecordService();
  console.log("🎉 Screen recording setup completed!");
} catch (error) {
  console.error("❌ Setup failed:", error);
}
