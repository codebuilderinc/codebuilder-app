const fs = require("fs-extra");
const path = require("path");

const SOUNDS_SRC = path.resolve(__dirname, "../assets/sounds");
const ANDROID_SOUNDS_DEST = path.resolve(
  __dirname,
  "../android/app/src/main/res/raw"
);
const IOS_SOUNDS_DEST = path.resolve(
  __dirname,
  "../ios/CodeBuilderAdmin/Sounds"
); // Replace "YourAppName"

async function copySounds() {
  try {
    // Copy to Android (filter for Android-supported formats)
    await fs.ensureDir(ANDROID_SOUNDS_DEST);
    await fs.copy(SOUNDS_SRC, ANDROID_SOUNDS_DEST, {
      filter: (src) => {
        const ext = path.extname(src).toLowerCase();
        return [".mp3", ".wav", ".ogg"].includes(ext); // Android formats
      },
    });
    console.log("✅ Sounds copied to Android");

    // Copy to iOS (filter for iOS-supported formats)
    await fs.ensureDir(IOS_SOUNDS_DEST);
    await fs.copy(SOUNDS_SRC, IOS_SOUNDS_DEST, {
      filter: (src) => {
        const ext = path.extname(src).toLowerCase();
        return [".aiff", ".caf", ".wav"].includes(ext); // iOS formats
      },
    });
    console.log("✅ Sounds copied to iOS");
  } catch (err) {
    console.error("❌ Error copying sounds:", err);
    process.exit(1);
  }
}

copySounds();
