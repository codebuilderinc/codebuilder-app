# Quick Start Guide - Local Android Build

## TL;DR (5 Steps to Get Started)

### 1. Ensure Prerequisites

```bash
# Check all required tools
java -version        # Need Java 17+
node -v             # Need Node 22+
echo $ANDROID_HOME  # Should output Android SDK path
adb --version       # Need Android platform tools
```

### 2. Set ANDROID_HOME (If Not Set)

```bash
# Linux/macOS
export ANDROID_HOME=~/Android/Sdk
echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.zshrc
source ~/.zshrc

# Verify
echo $ANDROID_HOME  # Should show path
```

### 3. Create GitHub PAT

- Go to github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token with `repo` and `admin:repo_hook` scopes
- Copy the token (save securely!)

### 4. Set Up Runner

```bash
mkdir -p ~/.github-runner
cd ~/.github-runner

# Download runner (check latest version at github.com/actions/runner/releases)
curl -o actions-runner-linux-x64-2.315.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.315.0/actions-runner-linux-x64-2.315.0.tar.gz
tar xzf actions-runner-linux-x64-2.315.0.tar.gz

# Configure
./config.sh --url https://github.com/codebuilderinc/codebuilder-app \
  --token YOUR_TOKEN_HERE

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

### 5. Trigger Build

- Go to GitHub: **Actions** → **Local Android Build (Self-Hosted)**
- Click **Run workflow**
- Wait for completion (~15-30 mins depending on your machine)
- Download APK from **Build artifacts** or **Releases**

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────┐
│         GitHub Actions - Local Build Workflow           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │   Runs on self-hosted runner        │
        │   (Your local machine)              │
        └─────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
   ┌───────────┐                    ┌──────────────┐
   │ Checkout  │                    │Get Version   │
   │    Code   │                    │ from JSON    │
   └─────┬─────┘                    └──────┬───────┘
         │                                 │
         └────────────────┬────────────────┘
                          ▼
            ┌──────────────────────────┐
            │  Install Dependencies    │
            │  npm ci --legacy-peers   │
            └────────────┬─────────────┘
                         ▼
            ┌──────────────────────────┐
            │  Create Expo Bundle      │
            │  npm run prepare         │
            └────────────┬─────────────┘
                         ▼
            ┌──────────────────────────┐
            │  Build Release APK       │
            │  ./gradlew assembleRelease
            └────────────┬─────────────┘
                         ▼
            ┌──────────────────────────┐
            │  Rename APK with Ver    │
            │  app-release-v1.0.80..  │
            └────────────┬─────────────┘
                         ▼
            ┌──────────────────────────┐
            │  Upload as Artifact      │
            │  (14 day retention)      │
            └────────────┬─────────────┘
                         ▼
            ┌──────────────────────────┐
            │  Create GitHub Release   │
            │  with APK & Changelog    │
            └──────────────────────────┘
```

## Performance Tips

1. **Use SSD** - Faster Gradle builds (5-10x speedup)
2. **Close heavy apps** - Free up RAM during build
3. **Incremental builds** - Gradle caches outputs
4. **Parallel tasks** - Already configured in workflow
5. **Run at off-peak** - Less machine contention

Typical build times:

- Cold build (no cache): 20-30 minutes
- Incremental build (from cache): 5-10 minutes

## File Locations

| File                                        | Purpose              |
| ------------------------------------------- | -------------------- |
| `.github/workflows/local-android-build.yml` | Main workflow        |
| `LOCAL_BUILD_SETUP.md`                      | Detailed setup guide |
| `LOCAL_BUILD_QUICKSTART.md`                 | This file            |
| `LOCAL_BUILD_TROUBLESHOOTING.md`            | Common issues        |

## Common Commands

```bash
# Check runner status
sudo systemctl status actions.runner.*

# View runner logs
tail -f ~/.github-runner/_diag/Runner_*.log

# Stop runner
sudo ./svc.sh stop

# Restart runner
sudo ./svc.sh restart

# Remove runner
sudo ./svc.sh uninstall
```

## When to Use Each Workflow

| Scenario                 | Use                |
| ------------------------ | ------------------ |
| Hit Expo.dev build limit | Local build ✅     |
| Need iOS build           | EAS build (iOS) ✅ |
| Want managed service     | EAS build ✅       |
| Full control needed      | Local build ✅     |
| Budget constrained       | Local build ✅     |
| Machine offline          | EAS build ✅       |

## Costs

**Local Build:**

- Equipment: One-time (computer you already have)
- Electricity: ~$5-20/month depending on usage
- GitHub storage: Free-2GB depending on plan

**EAS Build:**

- Build minutes: $20/month minimum
- Additional builds: Extra charges

## Manual APK Installation

After download:

```bash
# Connect device via USB with USB debugging enabled
adb install app-release-v1.0.80-build-*.apk

# Or push to emulator
adb push app-release-v1.0.80-build-*.apk /data/local/tmp
adb shell pm install /data/local/tmp/app-release-v1.0.80-build-*.apk
```

## Need Help?

See `LOCAL_BUILD_TROUBLESHOOTING.md` for:

- Runner offline issues
- Java version problems
- Build failures
- APK not generated
- Android SDK issues
