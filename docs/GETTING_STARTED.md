# 🚀 Getting Started in 5 Minutes

## What You're Getting

A complete alternative to Expo.dev for building Android APKs **without paying $20/month**. Instead, you'll use your local machine as a build server through GitHub Actions.

---

## The Problem You Had

- ❌ Hit Expo.dev builds limit for the next 3 days
- ❌ Don't want to pay $20 for a subscription
- ❌ Need a way to build APKs independently

## The Solution

✅ **Local Android Build Workflow** - Build directly on your machine using Gradle + GitHub Actions

---

## What Got Created

| File                                        | Purpose                                        |
| ------------------------------------------- | ---------------------------------------------- |
| `.github/workflows/local-android-build.yml` | **The actual workflow** - runs on your machine |
| `LOCAL_BUILD_QUICKSTART.md`                 | Quick 5-step reference                         |
| `LOCAL_BUILD_SETUP.md`                      | Complete setup guide with prerequisites        |
| `LOCAL_BUILD_TROUBLESHOOTING.md`            | Solutions for 15+ common issues                |
| `LOCAL_BUILD_ARCHITECTURE.md`               | Visual diagrams & architecture                 |
| `IMPLEMENTATION_SUMMARY.md`                 | Overview & comparison                          |

---

## Immediate Next Steps (Do These Now)

### ✅ Step 1: Check Your Machine (2 min)

```bash
# Check Java (need 17+)
java -version
echo "Expected: java 17+"

# Check Android SDK location
echo $ANDROID_HOME
echo "If empty, do: export ANDROID_HOME=~/Android/Sdk"

# Check Node (should have 22.x)
node -v

# Check Git
git config user.name
```

**If ANDROID_HOME is empty:**

```bash
export ANDROID_HOME=~/Android/Sdk
echo 'export ANDROID_HOME=~/Android/Sdk' >> ~/.zshrc
source ~/.zshrc
```

### ✅ Step 2: Create GitHub Token (2 min)

1. Go to: **github.com** → **Settings** (top right profile icon)
2. Click: **Developer settings** (bottom of left menu)
3. Click: **Personal access tokens** → **Tokens (classic)**
4. Click: **Generate new token (classic)**
5. **Name it:** "local-android-runner"
6. **Expiration:** 90 days (or longer)
7. **Select scopes:** Check ✅:
    - `repo` (Full control of private repositories)
    - `admin:repo_hook` (Read/write access to hooks)
8. Click: **Generate token**
9. **Copy it immediately** and save somewhere secure (you won't see it again!)

### ✅ Step 3: Set Up GitHub Actions Runner (5-10 min)

```bash
# Go to home directory
cd ~

# Create runner directory
mkdir -p .github-runner
cd .github-runner

# Download the runner (check version at github.com/actions/runner)
# Current: 2.315.0 (update version number if newer)
wget https://github.com/actions/runner/releases/download/v2.315.0/actions-runner-linux-x64-2.315.0.tar.gz

# Extract
tar xzf actions-runner-linux-x64-2.315.0.tar.gz

# Configure (replace YOUR_TOKEN_HERE with token from Step 2)
./config.sh --url https://github.com/codebuilderinc/codebuilder-app \
  --token YOUR_TOKEN_HERE

# When prompted:
# - Runner name: (press Enter for default or type a name like 'local-build-1')
# - Work directory: (press Enter for default)
# - Labels: (press Enter for default)

# Install as background service (so it runs on startup)
sudo ./svc.sh install

# Start the runner
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
# Should show: "active (running)"
```

### ✅ Step 4: Verify Runner is Online (1 min)

1. Go to GitHub: **codebuilderinc/codebuilder-app**
2. Click: **Settings** tab
3. Left menu: **Actions** → **Runners**
4. Look for your runner (name from Step 3)
5. Should show: **Green dot with "Idle"**

If it shows red/offline:

```bash
cd ~/.github-runner
./run.sh --diagnostics
```

### ✅ Step 5: Test Build (5-30 min depending on machine)

1. Go to your repo on GitHub
2. Click: **Actions** tab
3. Left menu: Click **Local Android Build (Self-Hosted)**
4. Click: **Run workflow** button (top right)
5. Select branch: **main**
6. Click: **Run workflow**
7. Watch the build run in real-time!

**Build time:**

- First build (cold): 20-30 minutes
- Future builds (warm cache): 5-10 minutes

---

## After Your Build Completes

### Download Your APK

**Option A: From GitHub Actions**

- Go to **Actions** tab → Your workflow run
- Scroll down to **Artifacts**
- Download `android-apk-local`

**Option B: From GitHub Releases**

- Go to **Releases** tab (right side, above tags)
- Download the APK file from the release

### Install on Device

```bash
# Connect your Android device via USB (with USB debugging enabled)
adb install app-release-v1.0.80-build-*.apk

# Or install on emulator
adb -e install app-release-v1.0.80-build-*.apk
```

---

## How to Use Going Forward

### Automatic Builds (Every Push)

The workflow runs automatically on every push to any branch.

### Manual Builds Anytime

1. GitHub: **Actions** tab
2. **Local Android Build (Self-Hosted)**
3. **Run workflow**
4. Done! Check progress in real-time

### Check Build Status

- GitHub: **Actions** tab → Your workflow run
- See real-time logs, errors, artifacts, and releases

---

## Key Features

✅ **Cost Savings**

- No Expo.dev subscription
- No build credits to buy
- Only pay for electricity (~$5-20/month)

✅ **Version Management**

- Auto-increments version on main branch
- Pre-release versions for dev branches
- Build metadata tracked

✅ **GitHub Integration**

- Automatic releases created
- Changelogs generated from git commits
- Artifacts retained for 14 days

✅ **Full Control**

- Customize build process
- Full access to Gradle configuration
- Can adjust build parameters

---

## Troubleshooting Quick Links

| Problem                | Solution                                           |
| ---------------------- | -------------------------------------------------- |
| Runner offline         | See `LOCAL_BUILD_SETUP.md` Step 2                  |
| ANDROID_HOME not found | Set it: `export ANDROID_HOME=~/Android/Sdk`        |
| Java wrong version     | Install Java 17: `sudo apt install openjdk-17-jdk` |
| Build never starts     | Check runner is online (Step 4 above)              |
| APK not generated      | See `LOCAL_BUILD_TROUBLESHOOTING.md` #7            |
| Other issues           | See `LOCAL_BUILD_TROUBLESHOOTING.md`               |

---

## File Reference

All documentation is in your repo:

```
codebuilder-app/
├─ .github/workflows/
│  └─ local-android-build.yml          ← The workflow file
│
├─ LOCAL_BUILD_QUICKSTART.md           ← This file (quick ref)
├─ LOCAL_BUILD_SETUP.md                ← Complete setup guide
├─ LOCAL_BUILD_TROUBLESHOOTING.md      ← Debugging guide
├─ LOCAL_BUILD_ARCHITECTURE.md         ← Visual diagrams
├─ IMPLEMENTATION_SUMMARY.md           ← Overview
└─ GETTING_STARTED.md                  ← You are here!
```

---

## Example: Complete Workflow

```
You write code
     ↓
git push origin main
     ↓
GitHub Actions triggered
     ↓
Runner picks up job (~instant if online)
     ↓
Build starts (20-30 min first time)
     ↓
npm installs dependencies
     ↓
Gradle builds APK
     ↓
APK signed with debug key
     ↓
APK uploaded as GitHub Artifact
     ↓
GitHub Release created with APK
     ↓
You download from Releases or Artifacts
     ↓
adb install app-release-*.apk
     ↓
App runs on your device! ✅
```

---

## Cost Comparison

### With Local Build (YOUR NEW SETUP)

- Initial setup: 15 minutes
- Monthly cost: $5-20 (your electricity)
- Build limit: Unlimited (while online)
- **Annual cost: $60-240**

### With EAS Only (Old Way)

- Setup: Already done
- Monthly cost: $20-100+
- Build limit: Depends on plan
- **Annual cost: $240-1200+**

**You save: $180-960+ per year!**

---

## Keeping Both Workflows

You can use both workflows:

| Use This        | When                    | Why                             |
| --------------- | ----------------------- | ------------------------------- |
| **Local Build** | Building Android APK    | Free, instant, full control     |
| **Local Build** | You're at your machine  | Saves money                     |
| **EAS Build**   | Building iOS app        | Local build can't do iOS        |
| **EAS Build**   | Your machine is offline | Doesn't depend on your computer |

To switch:

1. Just keep both workflows enabled
2. Use GitHub branch protection rules to control which builds are required
3. Manually choose which to trigger

---

## Managing the Runner

```bash
# Check runner status
sudo systemctl status actions.runner.*

# Stop runner (to stop builds)
sudo ./svc.sh stop

# Start runner (to resume builds)
sudo ./svc.sh start

# Restart (troubleshooting)
sudo ./svc.sh restart

# View runner logs
tail -50 ~/.github-runner/_diag/Runner_*.log

# Completely remove runner
sudo ./svc.sh uninstall && rm -rf ~/.github-runner
```

---

## Next: Read These Docs

1. **Quick Reference** → `LOCAL_BUILD_QUICKSTART.md` (this file)
2. **Full Setup** → `LOCAL_BUILD_SETUP.md` (if you get stuck)
3. **Troubleshooting** → `LOCAL_BUILD_TROUBLESHOOTING.md` (if issues)
4. **Architecture** → `LOCAL_BUILD_ARCHITECTURE.md` (to understand the system)

---

## You're Ready! 🎉

You now have:

- ✅ A new workflow that builds APKs locally
- ✅ No Expo.dev charges for the next 3+ days
- ✅ Full version control and GitHub integration
- ✅ Automatic releases and artifact management
- ✅ Complete documentation for setup and troubleshooting

**Next step: Follow Step 1-5 above to get it running!**

Questions? See the troubleshooting guide or check GitHub Actions logs.

---

## Summary

✨ **What changed:**

- New workflow file: `.github/workflows/local-android-build.yml`
- Runs on YOUR machine (self-hosted runner)
- Builds APKs without Expo charges

🚀 **What you need to do:**

1. Create GitHub PAT token
2. Set up actions runner on your machine
3. Trigger a build manually to test

💰 **What you save:**

- $20-100/month in Expo.dev charges
- $240-1200/year!

Happy building! 📱
