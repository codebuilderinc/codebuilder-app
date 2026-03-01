# Local Android Build Workflow - Implementation Summary

## What Was Created

This implementation provides a **complete alternative to Expo.dev builds** for Android APKs, using GitHub Actions self-hosted runners. It lets you build APKs directly on your local machine during GitHub workflows.

---

## Files Added

### 1. **Workflow File** (Main Implementation)

📄 `.github/workflows/local-android-build.yml` - **The buildworkflow**

- Builds APKs using Gradle (no Expo.dev)
- Creates GitHub releases with APKs
- Versioning and changelog generation
- Requires self-hosted runner setup

### 2. **Documentation** (Setup & Usage)

📄 `LOCAL_BUILD_SETUP.md` - **Complete setup guide**

- Prerequisites checklist
- Step-by-step runner configuration
- Troubleshooting for each step
- Security best practices
- Comparison with EAS builds

📄 `LOCAL_BUILD_QUICKSTART.md` - **Quick reference**

- 5-step quick start
- Workflow diagram
- Common commands
- Performance tips
- When to use each workflow

📄 `LOCAL_BUILD_TROUBLESHOOTING.md` - **Debug guide**

- 15+ common issues with solutions
- Diagnostic commands
- Performance optimization
- When to rebuild runner

📄 `IMPLEMENTATION_SUMMARY.md` - **This file**

---

## How It Works

```
User pushes code or manually triggers
              ↓
GitHub Actions workflow starts
              ↓
Runs on your self-hosted runner (local machine)
              ↓
1. Checkout code
2. Install npm dependencies
3. Create Expo bundle
4. Run: ./gradlew assembleRelease
5. Sign APK with existing keystore
              ↓
APK is generated & uploaded
              ↓
GitHub releases created with APK
              ↓
Ready to download & test
```

---

## Key Features

✅ **Zero Expo.dev Costs**

- No subscription fees
- No build minutes to track
- Only electricity costs (~$5-20/month)

✅ **Full GitHub Integration**

- Automatic releases on every push
- Changelog generation from git history
- Artifact retention (14 days)
- Manual trigger option

✅ **Production-Ready**

- Automatic version bumping on main branch
- Pre-release builds for feature branches
- Branch-aware versioning
- Build metadata tracking

✅ **Version Management**

- Reads version from `version.json`
- Auto-increments on main branch
- Pre-release versions for dev branches
- Build number & date tracking

---

## Quick Setup (5 Minutes)

### 1. Verify Prerequisites

```bash
java -version        # Java 17+
node -v             # Node 22+
echo $ANDROID_HOME  # Should be set
```

### 2. Set ANDROID_HOME (if needed)

```bash
export ANDROID_HOME=~/Android/Sdk
echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.zshrc
source ~/.zshrc
```

### 3. Create GitHub PAT

- github.com → Settings → Developer settings → Personal access tokens
- Generate with `repo` and `admin:repo_hook` scopes

### 4. Install Runner

```bash
mkdir -p ~/.github-runner
cd ~/.github-runner
curl -o actions-runner-linux-x64-2.315.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.315.0/actions-runner-linux-x64-2.315.0.tar.gz
tar xzf actions-runner-linux-x64-2.315.0.tar.gz
./config.sh --url https://github.com/codebuilderinc/codebuilder-app --token YOUR_PAT
sudo ./svc.sh install && sudo ./svc.sh start
```

### 5. Trigger Build

- Go to GitHub Actions → Local Android Build → Run workflow

---

## Workflow Triggers

### Automatic

- ✅ On every push to any branch
- ✅ On changes to the workflow file

### Manual

- ✅ Click "Run workflow" in Actions tab
- ✅ Select branch and click run

### Scheduled (Optional)

Can add to workflow:

```yaml
on:
    schedule:
        - cron: '0 2 * * *' # Daily at 2 AM UTC
```

---

## Build Output

After successful build:

1. **Artifact uploaded** to GitHub Actions
    - Name: `app-release-v{version}-build-{number}.apk`
    - Retained for 14 days
    - Available in Artifacts section

2. **GitHub Release created** with:
    - Full APK file download
    - Changelog from git commits
    - Build metadata (version, date, branch)
    - Release notes

3. **Installation options:**
    ```bash
    adb install app-release-v1.0.80-build-*.apk
    ```

---

## Typical Build Times

| Build Type      | Time      | Notes                    |
| --------------- | --------- | ------------------------ |
| **Cold Build**  | 20-30 min | First build, no cache    |
| **Incremental** | 5-10 min  | From cached dependencies |
| **Clean**       | 25-35 min | After cache clear        |

Depends on:

- Your machine CPU/RAM
- Network speed (npm install)
- Android SDK location (SSD vs HDD)

---

## Comparison: Local vs EAS Builds

| Feature                     | Local Build | EAS Build         |
| --------------------------- | ----------- | ----------------- |
| **Cost**                    | Free\*      | $20/month         |
| **Speed**                   | 5-30 min    | 10-15 min (queue) |
| **Setup**                   | ~15 min     | Instant           |
| **Android Support**         | ✅ Yes      | ✅ Yes            |
| **iOS Support**             | ❌ No       | ✅ Yes            |
| **Control**                 | ✅ Full     | Limited           |
| **Requires online machine** | ✅ Yes      | ❌ No             |
| **Build customization**     | ✅ Easy     | Limited           |

\*Only electricity cost

---

## Configuration Files

Your existing files used by this workflow:

| File                                        | Purpose                           |
| ------------------------------------------- | --------------------------------- |
| `.github/workflows/local-android-build.yml` | Workflow definition (NEW)         |
| `android/gradlew`                           | Gradle wrapper (existing)         |
| `android/app/build.gradle`                  | Android build config (existing)   |
| `package.json`                              | Dependencies & scripts (existing) |
| `version.json`                              | Version management (existing)     |
| `android/app/debug.keystore`                | For signing APK (existing)        |

---

## Using Both Workflows

You can keep both set up and use each for different purposes:

```
┌─────────────────────────────────────────────┐
│  .github/workflows/                         │
├─────────────────────────────────────────────┤
│ eas-android-build.yml      (Existing)       │
│   → For complete builds when needed         │
│   → For iOS builds                          │
│   → When your machine is offline            │
│                                             │
│ local-android-build.yml    (NEW)            │
│   → For quick APK builds                    │
│   → When you hit Expo limits                │
│   → For cost savings                        │
└─────────────────────────────────────────────┘
```

**To switch between them:**

- Both can coexist and run independently
- Disable EAS workflow if you want to limit runs
- Set up GitHub branch protection rules to require approval

---

## Important Notes

### Signing

- Currently uses debug keystore from your repo
- Change signing config in `android/app/build.gradle` for production:
    ```gradle
    signingConfigs {
      release {
        storeFile file('path/to/keystore.jks')
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
      }
    }
    ```

### GitHub Secrets (Optional for Production)

If you want to add production signing:

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add:
    - `KEYSTORE_PASSWORD`
    - `KEY_ALIAS`
    - `KEY_PASSWORD`

### Machine Availability

- Runner must be online & accessible during builds
- If machine goes offline, workflow will wait until it's back
- Use systemd/launchd service to auto-start on reboot

---

## Next Steps

1. ✅ **Review the workflow file** - `.github/workflows/local-android-build.yml`
2. ✅ **Read Setup guide** - `LOCAL_BUILD_SETUP.md`
3. ✅ **Configure your machine** - Install Java 17, set ANDROID_HOME
4. ✅ **Create GitHub PAT** - Follow setup guide step 1
5. ✅ **Install runner** - Follow setup guide steps 2-4
6. ✅ **Test build** - Manual trigger in GitHub Actions
7. ✅ **Download APK** - From Releases or Artifacts
8. ✅ **Install on device** - `adb install app-release-*.apk`

---

## Support & Documentation

| Need                    | See                                        |
| ----------------------- | ------------------------------------------ |
| Full setup instructions | `LOCAL_BUILD_SETUP.md`                     |
| Quick 5-minute start    | `LOCAL_BUILD_QUICKSTART.md`                |
| Troubleshooting         | `LOCAL_BUILD_TROUBLESHOOTING.md`           |
| This summary            | `IMPLEMENTATION_SUMMARY.md` (current file) |

---

## Workflow Outputs

The workflow generates:

```
GitHub Repository
├── Actions (workflow runs visible here)
├── Artifacts (APK files, 14-day retention)
│   └── android-apk-local
│       └── app-release-v1.0.80-build-*.apk
├── Releases (tagged releases with APKs)
│   └── v1.0.80 or prerelease-branch-*.yml
│       ├── APK download
│       ├── Release notes
│       └── Changelog
└── .github/workflows/
    ├── eas-android-build.yml (existing)
    └── local-android-build.yml (new)
```

---

## Environment Variables Set by Workflow

These are available within the workflow for logging:

```bash
APP_VERSION          # e.g., "1.0.80"
BUILD_NUMBER         # GitHub run ID
BUILD_DATE          # Timestamp YYYYMMDD-HHMMSS
IS_PRODUCTION       # "true" for main, "false" for others
BRANCH_NAME         # Git branch name
```

---

## Cost Analysis

### Local Build Method

- **Setup cost**: 15-30 minutes of your time
- **Hardware**: Computer you already have
- **Monthly cost**: ~$5-20 (electricity only)
- **GitHub storage**: Free-2GB depending on plan
- **Annual cost**: $60-240

### EAS Build Method

- **Setup cost**: 5 minutes (service already exists)
- **Monthly cost**: $20-100+ (build minutes)
- **Annual cost**: $240-1200+

**Savings with local build**: $240-960/year

---

## Disabling/Re-enabling Workflows

To temporarily disable:

```bash
# Disable local builds
mv .github/workflows/local-android-build.yml .github/workflows/local-android-build.yml.disabled

# Re-enable
mv .github/workflows/local-android-build.yml.disabled .github/workflows/local-android-build.yml
```

Or in GitHub UI:

- Settings → Actions → Disable all
- Or selectively disable each workflow

---

## Questions?

Refer to:

1. The specific file in docs (Setup, Quick Start, Troubleshooting)
2. Workflow comments in `.github/workflows/local-android-build.yml`
3. Official GitHub Actions docs: https://docs.github.com/actions
4. GitHub Runners docs: https://docs.github.com/actions/hosting-your-own-runners
