const fs = require('fs');
const path = require('path');

function safeCopyFile(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.copyFileSync(src, dest);
  return true;
}

function run() {
  const repoRoot = path.join(__dirname, '..');
  const androidDir = path.join(repoRoot, 'android');
  const destDir = path.join(repoRoot, 'build', 'android');

  if (!fs.existsSync(androidDir)) {
    console.warn('No android directory found to copy from:', androidDir);
    return;
  }

  fs.mkdirSync(destDir, { recursive: true });

  // Copy wrapper scripts
  const gradlew = path.join(androidDir, 'gradlew');
  const gradlewBat = path.join(androidDir, 'gradlew.bat');
  if (safeCopyFile(gradlew, path.join(destDir, 'gradlew'))) {
    try { fs.chmodSync(path.join(destDir, 'gradlew'), 0o755); } catch (e) {}
    console.log('Copied gradlew to', destDir);
  }
  if (safeCopyFile(gradlewBat, path.join(destDir, 'gradlew.bat'))) {
    console.log('Copied gradlew.bat to', destDir);
  }

  // Copy gradle directory if present
  const gradleDir = path.join(androidDir, 'gradle');
  const destGradleDir = path.join(destDir, 'gradle');
  if (fs.existsSync(gradleDir)) {
    // Use recursive copy available in Node 16+
    try {
      fs.cpSync(gradleDir, destGradleDir, { recursive: true });
      console.log('Copied gradle/ to', destGradleDir);
    } catch (e) {
      console.warn('Failed to copy gradle directory:', e.message);
    }
  }
}

if (require.main === module) run();

module.exports = run;
