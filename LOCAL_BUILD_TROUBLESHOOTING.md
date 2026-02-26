# Local Build Workflow - Troubleshooting Guide

## Common Issues & Solutions

### 1. Runner Shows "Offline"

**Symptom:** Runner appears in GitHub settings but status is "Offline"

**Solutions:**

```bash
# Check if service is running
sudo systemctl status actions.runner.*

# If not running, start it
sudo systemctl start actions.runner.*

# Check runner logs
tail -50 ~/.github-runner/_diag/Runner_*.log

# Restart runner service
sudo ./svc.sh stop
sudo ./svc.sh restart

# Check network connectivity
ping github.com

# Verify runner can reach GitHub
curl -I https://api.github.com
```

### 2. "ANDROID_HOME not set" Error

**Symptom:** Workflow fails with "Error: ANDROID_HOME not set!"

**Solution:**

```bash
# Find your Android SDK location
# Common paths:
# - Linux: ~/Android/Sdk
# - macOS: ~/Library/Android/sdk
# - Windows: C:\Users\YourUser\AppData\Local\Android\sdk

# Set permanently for current user
# Add to ~/.bashrc, ~/.zshrc, or ~/.bash_profile:
echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools' >> ~/.zshrc

# Reload shell
source ~/.zshrc

# Verify
echo $ANDROID_HOME
ls $ANDROID_HOME/platforms  # Should list Android API levels
```

### 3. "Unable to Locate Java" or Wrong Java Version

**Symptom:** Build fails with Java errors or Java incompatibility

**Verify Java:**
```bash
java -version
# Should show Java 17 or higher
# Example: openjdk version "17.0.8" 2023-07-18 LTS

# Check gradle wrapper's java
cd android
./gradlew --version
```

**Install Java 17+:**

Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install openjdk-17-jdk

# Verify
java -version
```

macOS (Homebrew):
```bash
brew install openjdk@17
sudo ln -sfn /usr/local/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

### 4. "npm ci" Fails or Dependencies Missing

**Symptom:** `npm ERR!` during `npm ci --legacy-peer-deps`

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Try again
npm ci --legacy-peer-deps

# If still fails, try npm install
npm install --legacy-peer-deps

# Or use pnpm (your project uses it)
pnpm install
```

### 5. Gradle Build Fails

**Symptom:** `./gradlew assembleRelease` fails with compilation errors

**Common Solutions:**

```bash
# Clean build
cd android
./gradlew clean

# Rebuild with verbose output
./gradlew assembleRelease --stacktrace

# Check Gradle version compatibility
./gradlew --version

# Increase memory for Gradle
export _JAVA_OPTIONS="-Xmx4096m"
./gradlew assembleRelease
```

**Check for common issues:**

```bash
# Verify gradle wrapper is executable
chmod +x android/gradlew

# Check Java compatibility
java -version  # Must be 17+

# Verify Android SDK has required components
ls $ANDROID_HOME/build-tools/  # Should have contents
ls $ANDROID_HOME/platforms/    # Should have API 34+
```

### 6. "npm run prepare" Fails

**Symptom:** Expo bundle preparation fails

**Solutions:**

```bash
# Manually test prepare script
npm run prepare

# Check for build script errors
cat package.json | grep "prepare"

# Clear expo cache
rm -rf node_modules/.expo

# Reinstall
npm ci --legacy-peer-deps
npm run prepare
```

### 7. APK Not Generated

**Symptom:** Build succeeds but no APK file found

**Debug:**

```bash
# Check build output directory
find android/app/build -type f -name "*.apk"
find android/app/build -type f -name "*.aab"

# Check for build errors
ls -la android/app/build/outputs/

# Look at gradle output
cd android
./gradlew assembleRelease --info 2>&1 | tail -100
```

### 8. "Gradle Wrapper Not Executable"

**Symptom:** Permission denied on `./gradlew`

**Solution:**

```bash
# Make executable
chmod +x android/gradlew

# Verify
ls -l android/gradlew
# Should show: -rwxr-xr-x (with x permissions)

# Try again
./gradlew assembleRelease
```

### 9. Out of Memory Errors

**Symptom:** `OutOfMemoryError` or `GC overhead limit exceeded`

**Solutions:**

```bash
# Increase Java heap
export _JAVA_OPTIONS="-Xmx4096m -Xms1024m"

# In build.gradle, add (android/app/build.gradle):
# android {
#     dexOptions {
#         javaMaxHeapSize "4g"
#     }
# }

# Or use gradle.properties (android/gradle.properties):
echo 'org.gradle.jvmargs=-Xmx4096m' >> android/gradle.properties
```

### 10. "Build Tools Version X Not Installed"

**Symptom:** `Failed to find Build Tools version X.Y.Z`

**Solution:**

```bash
# Check what's installed
ls $ANDROID_HOME/build-tools/

# Check what's needed in build.gradle
grep buildToolsVersion android/build.gradle

# Install missing version or update build.gradle to use available version
# The workflow shows it needs buildToolsVersion from gradle.properties
```

### 11. Runner Configuration Issues

**Symptom:** Runner won't configure or keeps getting stuck

**Solutions:**

```bash
# Remove and reconfigure
cd ~/.github-runner
./config.sh remove --token GITHUB_TOKEN

# Try fresh configuration
rm -f .runner  # Remove previous config
./config.sh --url https://github.com/codebuilderinc/codebuilder-app \
  --token NEW_TOKEN

# Start fresh
sudo ./svc.sh uninstall
sudo ./svc.sh install
sudo ./svc.sh start
```

### 12. GitHub Token/Authentication Issues

**Symptom:** Runner fails to authenticate with GitHub

**Solutions:**

```bash
# Verify token is valid and not expired
# Go to GitHub Settings > Developer settings > Personal access tokens

# Reconfigure runner with new token
cd ~/.github-runner
./config.sh --url https://github.com/codebuilderinc/codebuilder-app \
  --token NEW_PAT_HERE --replace

# Restart service
sudo ./svc.sh restart
```

### 13. Workflow Gets Stuck / Times Out

**Symptom:** Workflow runs for hours or shows spinning indicator

**Likely cause:** Build is really just slow (normal for cold builds)

**Monitor progress:**
```bash
# SSH into build machine
# Check gradle processes
ps aux | grep gradle

# Monitor disk I/O
iostat -x 1

# Check memory
free -h

# Monitor network
iftop
```

**Optimization:**
- First build: 20-30 minutes is normal
- Incremental: 5-10 minutes
- Close heavy applications
- Use SSD if possible

### 14. "Version.json Not Found"

**Symptom:** `jq -r '.version' version.json` fails

**Verify:**
```bash
# Check file exists
ls -la version.json

# Check contents
cat version.json

# Verify JSON is valid
jq . version.json
```

### 15. APK Installation Fails on Device

**After workflow succeeds but APK won't install:**

```bash
# Test on emulator
adb -e install app-release-*.apk

# Test on device
adb -d install app-release-*.apk

# If app already exists, uninstall first
adb uninstall com.digitalnomad91.codebuilderadmin

# Try again
adb install app-release-*.apk

# For detailed install logs
adb logcat | grep PackageManager
```

## Diagnostic Commands

Keep these handy for troubleshooting:

```bash
# Full system check
echo "=== Java ===" && java -version
echo "=== Node ===" && node -v
echo "=== NPM ===" && npm -v
echo "=== Android SDK ===" && ls $ANDROID_HOME/platforms
echo "=== Build Tools ===" && ls $ANDROID_HOME/build-tools
echo "=== Git ===" && git --version
echo "=== Runner ===" && sudo systemctl status actions.runner.*

# Check runner connectivity
cd ~/.github-runner && ./run.sh --once --diagnostics

# View runner logs
tail -n 100 ~/.github-runner/_diag/Runner_*.log

# Test gradle
cd android && ./gradlew --version
```

## When to Rebuild Runner

If multiple issues persist:

```bash
# 1. Stop runner
sudo ./svc.sh stop

# 2. Backup current config
cp -r ~/.github-runner ~/.github-runner.backup

# 3. Remove runner from GitHub
cd ~/.github-runner
./config.sh remove --token GITHUB_TOKEN

# 4. Reinstall everything
rm -rf ~/.github-runner
mkdir -p ~/.github-runner
cd ~/.github-runner

# Download fresh runner
curl -o actions-runner-linux-x64-2.315.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.315.0/actions-runner-linux-x64-2.315.0.tar.gz
tar xzf actions-runner-linux-x64-2.315.0.tar.gz

# Reconfigure
./config.sh --url https://github.com/codebuilderinc/codebuilder-app \
  --token NEW_TOKEN

# Start service
sudo ./svc.sh install
sudo ./svc.sh start
```

## Getting Help

If stuck:

1. **Check workflow logs** in GitHub Actions
2. **Search the logs** for keywords: "Error", "Failed", "fatal"
3. **Run diagnostic commands** above
4. **Review this guide** for your specific error
5. **Check GitHub runner docs**: https://docs.github.com/en/actions/hosting-your-own-runners
6. **Enable verbose logging**: Add `--stacktrace` to gradle commands

## Enabling Debug Logging

```yaml
# Add to workflow for verbose output:
env:
  GRADLE_OPTS: "-Dorg.gradle.logging.level=debug"
  DEBUG: "true"
```

Then check logs for detailed build information.
