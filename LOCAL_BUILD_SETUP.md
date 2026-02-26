# Local Android Build Workflow - Setup Guide

## Overview

This guide helps you set up a self-hosted GitHub Actions runner on your local machine to build APKs directly using Gradle, bypassing Expo.dev's build service and associated costs.

**File:** `.github/workflows/local-android-build.yml`

## Why This Workflow?

- ✅ **No Expo.dev costs** - Build directly on your machine
- ✅ **Full control** - Customize build process as needed
- ✅ **Faster feedback** - No cloud queue delays
- ⚠️ **Machine dependency** - Runner must be online and accessible

## Prerequisites

Before setting up the runner, ensure your machine has:

### 1. Android SDK & Build Tools
- **Android SDK installed** (API level 34+)
- **Android Build Tools** (latest recommended)
- **ANDROID_HOME environment variable** set

```bash
# Check current setup
echo $ANDROID_HOME

# If not set, add to ~/.bashrc or ~/.zshrc:
# export ANDROID_HOME=~/Android/Sdk
# export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 2. Java Development Kit (JDK)
- **Java 17+** (required for Android Gradle Plugin 8.x)

```bash
java -version  # Should be 17 or higher
```

### 3. Node.js
- **Node.js 22.x** (or version specified in your app)

```bash
node -v
npm -v
```

### 4. Git
- Git must be configured globally

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

## Setting Up Self-Hosted Runner

### Step 1: Create Personal Access Token (PAT)

1. Go to **GitHub.com** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Set **Expiration:** 90 days (or longer)
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `admin:repo_hook` (Write access to hooks in public or private repositories)
   - ✅ `admin:org_hook` (Read:org_hook)
5. Click **Generate token** and copy it immediately
6. Store it securely (you won't see it again)

### Step 2: Configure Runner on Your Machine

```bash
# Navigate to your project directory
cd /home/digitalnomad91/codebuilder-app

# Create runner directory
mkdir -p ~/.github-runner
cd ~/.github-runner

# Download the runner (Linux example - adjust for your OS)
curl -o actions-runner-linux-x64-2.315.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.315.0/actions-runner-linux-x64-2.315.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.315.0.tar.gz

# Configure the runner
./config.sh --url https://github.com/codebuilderinc/codebuilder-app \
  --token YOUR_GITHUB_TOKEN_HERE
```

During configuration:
- **Runner name:** Something like `local-build-machine` or `my-mac`
- **Work directory:** Press Enter to use default (`_work`)
- **Labels:** Optional (e.g., `self-hosted,linux`)
- **Default:** Accept defaults

### Step 3: Run the Runner

#### Option A: Run in Foreground (Testing)
```bash
cd ~/.github-runner
./run.sh
```

#### Option B: Run as Service (Recommended for 24/7)

**On Linux (systemd):**
```bash
cd ~/.github-runner
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

**On macOS:**
```bash
cd ~/.github-runner
./svc.sh install
./svc.sh start
./svc.sh status
```

### Step 4: Verify in GitHub

1. Go to your repository
2. Navigate to **Settings** → **Actions** → **Runners**
3. Your runner should appear with status **Idle**

## Using the Workflow

### Trigger Options

#### Option 1: Manual Trigger (Recommended for Testing)
1. Go to **Actions** tab in your GitHub repository
2. Select **Local Android Build (Self-Hosted)** workflow
3. Click **Run workflow** → Select branch → Click **Run workflow**

#### Option 2: Automatic on Push
The workflow triggers automatically on:
- All branch pushes
- Changes to `.github/workflows/local-android-build.yml`

#### Option 3: Scheduled Build
To add a scheduled build (e.g., nightly), edit the workflow:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM UTC
```

### Monitoring Builds

1. Go to **Actions** tab
2. Click on the running workflow
3. View real-time logs
4. Check **Artifacts** after completion

### Release Artifacts

After a successful build:
1. Navigate to **Releases** page
2. Download the APK named: `app-release-{version}-build-{build_number}.apk`
3. Install on a device or emulator:
   ```bash
   adb install app-release-*.apk
   ```

## Troubleshooting

### Runner Shows "Offline"

```bash
cd ~/.github-runner

# Check if service is running
sudo systemctl status actions.runner.* # Linux
launchctl list | grep actions # macOS

# Restart runner
sudo ./svc.sh stop
sudo ./svc.sh start
```

### Build Fails: ANDROID_HOME Not Found

```bash
# Set ANDROID_HOME temporarily
export ANDROID_HOME=~/Android/Sdk

# Or add to your shell profile
echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.bashrc
source ~/.bashrc
```

### Build Fails: Java Version Wrong

```bash
# Verify Java version
java -version

# Switch Java version (if multiple installed)
export JAVA_HOME=/usr/libexec/java_home -v 17
```

### Build Takes Too Long

- Consider upgrading CPU/RAM on your machine
- Close unrelated applications during builds
- Use SSD if available

### APK Not Generated

Check the build logs for:
1. Gradle compilation errors
2. Missing dependencies
3. Resource binding issues
4. Signing key problems

## Storage Considerations

- **APKs retained:** 14 days (configurable in workflow)
- **Storage used:** ~200-400 MB per APK
- **GitHub Free Tier:** 500 MB total artifact storage
- **GitHub Pro:** 2 GB total artifact storage

Adjust retention-days in workflow if needed:
```yaml
retention-days: 7  # Keep for 7 days instead of 14
```

## Security Best Practices

1. **Keep runner machine secure** - It has access to your code
2. **Rotate PAT regularly** - Every 90 days recommended
3. **Limit runner labels** - Use specific labels to prevent accidental use
4. **Monitor runner logs** - Check for unauthorized access
5. **Use branch protection rules** - Require approvals before builds

## Workflow vs EAS Builds Comparison

| Feature | Local Build | EAS Build |
|---------|------------|-----------|
| **Cost** | Free (electricity) | $20/month |
| **Speed** | Depends on machine | ~5-10 mins |
| **Ease** | Requires setup | One-click |
| **Control** | Full | Limited |
| **Machine dependency** | Yes | No |
| **Cloud bandwidth** | No | Yes |
| **Build parallelization** | No | Yes (paid) |

## Switching Between Workflows

Both workflows can coexist:

1. **Use Local Build** when you hit Expo.dev limits
2. **Use EAS Build** for full features or iOS builds
3. **Disable a workflow** by renaming it:
   ```
   .github/workflows/eas-android-build.yml.disabled
   ```

## Disabling the Workflow

Simply disable the GitHub Actions workflow:
1. Go to **Settings** → **Actions** → **General**
2. Select **Disable all** or individual workflows

## Support & Debugging

For persistent issues:

1. **Check runner logs:**
   ```bash
   cat ~/.github-runner/_diag/
   ```

2. **Check GitHub Actions logs** in your repository

3. **Verify all prerequisites:**
   ```bash
   java -version
   gradle -v
   node -v
   uname -m  # Check architecture (x86_64, etc.)
   ```

## Next Steps

1. ✅ Install Android SDK and Java 17
2. ✅ Create GitHub PAT
3. ✅ Set up runner on your machine
4. ✅ Test with manual workflow trigger
5. ✅ Monitor first build
6. ✅ Download and test APK on device
