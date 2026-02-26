# Local Android Build - Architecture & Setup Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB.COM                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Your Repository                                 │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ .github/workflows/                              │   │  │
│  │  │ ├── eas-android-build.yml      (Old - Expo.dev)│   │  │
│  │  │ └── local-android-build.yml    (New - Local)  │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │                        ▲                                 │  │
│  │                        │ (Push/Manual Trigger)          │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ Actions / Releases / Artifacts                  │   │  │
│  │  │ (Download APKs here after build)               │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               ▌  (API calls)
                               │
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
         ┌─────────────────┐  ┌─────────────────────┐
         │  EAS Build      │  │   GitHub Actions    │
         │  (Expo Cloud)   │  │   Runner Process    │
         │                 │  │                     │
         │ • Build on      │  │ (Runs on YOUR      │
         │   Expo servers  │  │  machine)          │
         │ • Cost: $20/mo  │  │                     │
         │                 │  │ • Local machine     │
         │ • Blue: Online  │  │ • Your runner.sh    │
         │   or offline    │  │ • Cost: Electricity │
         └─────────────────┘  └─────────────────────┘
                                        │
                                        │ (Must be online)
                                        │
                                        ▼
                          ┌──────────────────────────────┐
                          │   YOUR LOCAL MACHINE         │
                          │                              │
                          │ ┌────────────────────────┐  │
                          │ │  GitHub Actions Runner │  │
                          │ │  (./run.sh or service) │  │
                          │ └────────────────────────┘  │
                          │           │                 │
                          │           ▼                 │
                          │ ┌────────────────────────┐  │
                          │ │  npm ci --legacy-peers │  │
                          │ │  npm run prepare       │  │
                          │ └────────────────────────┘  │
                          │           │                 │
                          │           ▼                 │
                          │ ┌────────────────────────┐  │
                          │ │  ./gradlew clean       │  │
                          │ │  ./gradlew             │  │
                          │ │    assembleRelease    │  │
                          │ └────────────────────────┘  │
                          │           │                 │
                          │           ▼                 │
                          │ ┌────────────────────────┐  │
                          │ │  app-release-*.apk     │  │
                          │ │  (Generated!)          │  │
                          │ └────────────────────────┘  │
                          │                              │
                          │ Requirements:               │
                          │ • Android SDK               │
                          │ • Java 17+ ✅              │
                          │ • Node 22+ ✅              │
                          │ • Git ✅                    │
                          │ • 50GB disk space           │
                          │ • 8GB RAM (minimum)         │
                          └──────────────────────────────┘
```

## Data Flow

```
1. You Push Code / Manual Trigger
   │
   ├─► GitHub detects workflow trigger
   │
   ├─► Queues job for self-hosted runner
   │
   └─► Sends webhook to your runner at ~/.github-runner
           │
           ├─► Runner process picks up job
           │
           ├─► Checks out your code
           │
           ├─► npm ci --legacy-peer-deps
           │   (Install dependencies)
           │
           ├─► npm run prepare
           │   (Create Expo bundle)
           │
           ├─► ./gradlew assembleRelease
           │   (Build APK with Gradle)
           │   └─► Uses Android SDK
           │   └─► Uses Java compiler
           │   └─► Bundles everything
           │
           ├─► Generates app-release-*.apk
           │
           ├─► Signs APK (debug keystore)
           │
           ├─► Uploads as GitHub Artifact
           │
           ├─► Creates GitHub Release
           │
           └─► Reports success to GitHub
               │
               └─► You see it in Actions tab ✅
```

## Installation & Configuration

```
STEP 1: Prerequisites (Your Machine)
├─ Java 17+
│  └─ sudo apt install openjdk-17-jdk
├─ Android SDK (API 34+)
│  └─ ~/Android/Sdk
├─ ANDROID_HOME env var
│  └─ export ANDROID_HOME=~/Android/Sdk
├─ Node 22+
│  └─ Already installed ✅
└─ Git (already installed)
   └─ git config --global user.name "..."


STEP 2: GitHub Token
├─ github.com → Settings
├─ Developer settings → Personal access tokens
├─ Generate new token (classic)
├─ Scopes: repo, admin:repo_hook
└─ Copy token (save securely!)


STEP 3: Install Runner (~5 min)
├─ mkdir -p ~/.github-runner
├─ cd ~/.github-runner
├─ Download: curl -o actions-runner-linux-x64-2.315.0.tar.gz ...
├─ Extract: tar xzf actions-runner-linux-x64-2.315.0.tar.gz
├─ Configure: ./config.sh --url ... --token YOUR_TOKEN
└─ Install service:
   ├─ sudo ./svc.sh install
   └─ sudo ./svc.sh start


STEP 4: Verify Runner Online
├─ GitHub repo → Settings → Actions → Runners
└─ Your runner shows as "Idle" (green)


STEP 5: Test Build
├─ GitHub Actions tab
├─ Local Android Build (Self-Hosted)
├─ Run workflow
└─ Monitor logs in real-time
```

## Runner Service Management

```
┌─────────────────────────────────────────────────────┐
│  ~/.github-runner/  (Installation directory)        │
│                                                     │
│  ├─ run.sh                    (Manual runner)      │
│  ├─ svc.sh                    (Service manager)    │
│  ├─ config.sh                 (Configuration)      │
│  │                                                 │
│  ├─ actions/                  (Runner executable)  │
│  ├─ _diag/                    (Logs)              │
│  ├─ _work/                    (Build workspace)   │
│  └─ .runner                   (Config data)       │
│                                                     │
│  Common Commands:                                  │
│  ├─ sudo ./svc.sh install    → Register service   │
│  ├─ sudo ./svc.sh start      → Start runner       │
│  ├─ sudo ./svc.sh stop       → Stop runner        │
│  ├─ sudo ./svc.sh restart    → Restart runner     │
│  ├─ sudo ./svc.sh status     → Check status       │
│  └─ ./run.sh --once          → Run one job & exit │
│                                                     │
│  Logs:                                            │
│  ├─ ~/.github-runner/_diag/  (Diagnostic logs)   │
│  └─ tail -f ~/.github-runner/_diag/Runner_*.log  │
└─────────────────────────────────────────────────────┘
```

## Build Process Timeline

```
Duration: 5-30 minutes (depending on machine)

First Build (Cold Cache):
00:00 ├─ Checkout code                    (10s)
00:10 ├─ Extract branch/version           (5s)
00:15 ├─ Setup Node.js                    (5s)
00:20 ├─ npm ci (install deps)            (2-5 min)
02:20 ├─ npm run prepare (Expo bundle)    (1-2 min)
03:20 ├─ chmod gradlew                    (1s)
03:21 ├─ Gradle clean                     (10-15s)
03:35 ├─ gradlew assembleRelease          (10-20 min)
15:35 ├─ Locate APK                       (5s)
15:40 ├─ Rename APK                       (2s)
15:42 ├─ Upload artifact                  (1-2 min)
17:42 ├─ Generate changelog               (5s)
17:47 ├─ Create Github release            (10s)
17:57 └─ SUCCESS ✅

Second Build (With Cache):
00:00 ├─ Checkout code                    (10s)
00:10 ├─ Setup Node.js                    (5s)
00:15 ├─ npm ci (cached)                  (30s)
00:45 ├─ npm run prepare (cached)         (30s)
01:15 ├─ gradlew clean                    (15s)
01:30 ├─ gradlew assembleRelease (quick)  (5-10 min)
06:30 ├─ Upload & release                 (2 min)
08:30 └─ SUCCESS ✅
```

## Storage & Retention

```
GitHub Artifacts (auto-cleanup):
├─ android-apk-local/
│  └─ app-release-v1.0.80-build-12345.apk
│     ├─ Size: ~200-400 MB
│     └─ Retention: 14 days (then auto-delete)
│
└─ GitHub Storage Limits:
   ├─ Free plan: 500 MB
   ├─ Pro plan: 2 GB
   └─ Enterprise: 2 GB per user

GitHub Releases (permanent):
├─ v1.0.80 (tagged)
│  ├─ APK attached
│  ├─ Release notes
│  ├─ Changelog
│  └─ Stored indefinitely
```

## Comparison Matrix

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            LOCAL BUILD  │  EAS BUILD                      ║
║        ─────────────────────────────────                 ║
║ Setup             15 min │  2 min                         ║
║ Cost/month      $5-20   │  $20+                           ║
║ Speed         5-30 min   │  10-15 min (+ queue)           ║
║ Machine        Required  │  Not needed                    ║
║ Android            ✅    │  ✅                            ║
║ iOS                ❌    │  ✅                            ║
║ Full Control       ✅    │  Limited                       ║
║ Always Available   ❌*   │  ✅                            ║
║ Max Builds/mo    Unlimited│ Depends on quota             ║
║ Build Time Limits  None  │  60 min timeout               ║
║                                                           ║
║ *Requires your machine online                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## Decision Tree

```
              Want to build APK?
                      │
        ┌─────────────┴──────────────┐
        │                            │
    Hit Expo          Using your
    limits?           machine now?
        │                 │
       YES               YES
        │                 │
        ▼                 ▼
   ┌─────────────┐  ┌──────────────┐
   │LOCAL BUILD  │  │ LOCAL BUILD  │
   │✅ No cost   │  │ ✅ No fees   │
   │✅ Full APK  │  │ ✅ Full ctrl │
   │✅ Fast      │  │ ✅ Instant   │
   └─────────────┘  └──────────────┘
        ▲                 ▲
        │                 │
        └─────────────────┘
              │
             NO
              │
              ▼
        Machine offline
         or iOS build?
              │
         ┌────┴────┐
         │         │
        YES       NO
         │         │
         ▼         ▼
     ┌───────┐ ┌────────┐
     │   EAS │ │ Local  │
     │ Build │ │ Build  │
     └───────┘ └────────┘
```

## Workflow File Structure

```
.github/workflows/local-android-build.yml
│
├─ name: Local Android Build (Self-Hosted)
│
├─ on:
│  ├─ workflow_dispatch      (Manual trigger)
│  └─ push: ["**"]          (Auto on push)
│
├─ env:
│  └─ GITHUB_TOKEN: secrets
│
├─ jobs:
│  │
│  ├─ build-android-local
│  │  ├─ runs-on: self-hosted  ⚡ (YOUR MACHINE)
│  │  │
│  │  └─ steps:
│  │     ├─ Checkout code
│  │     ├─ Extract branch name
│  │     ├─ Setup Node 22.x
│  │     ├─ Install npm deps
│  │     ├─ Update version
│  │     ├─ Set version info
│  │     ├─ Verify Android SDK
│  │     ├─ Prepare Expo
│  │     ├─ Build with Gradle ⚙️ (5-20 min)
│  │     ├─ Find APK
│  │     ├─ Rename with version
│  │     └─ Upload artifact
│  │
│  ├─ create-release
│  │  ├─ runs-on: ubuntu-latest
│  │  │
│  │  └─ steps:
│  │     ├─ Download APK
│  │     ├─ Generate changelog
│  │     ├─ Create release
│  │     └─ Publish to GitHub
│  │
│  └─ notify-completion
│     ├─ runs-on: ubuntu-latest
│     └─ steps: Report status
│
└─ outputs:
   ├─ APK path
   ├─ App version
   ├─ Build number
   └─ Branch name
```

---

## Quick Reference Card

```
╔════════════════════════════════════════════════╗
║  LOCAL BUILD WORKFLOW - QUICK REFERENCE      ║
╠════════════════════════════════════════════════╣
║                                                ║
║  FILE: .github/workflows/local-android-build.yml
║                                                ║
║  TRIGGER:                                      ║
║  • Manual: GitHub Actions → Run workflow       ║
║  • Auto: Push to any branch                   ║
║                                                ║
║  MACHINE REQUIREMENTS:                        ║
║  • Java 17+: sudo apt install openjdk-17-jdk  ║
║  • Android SDK at ~/Android/Sdk               ║
║  • Node 22+ (already have)                    ║
║  • ANDROID_HOME environment variable          ║
║                                                ║
║  RUNNER SETUP:                                 ║
║  • mkdir ~/.github-runner                     ║
║  • Download runner tar.gz                     ║
║  • ./config.sh --url ... --token PAT           ║
║  • sudo ./svc.sh install && start              ║
║                                                ║
║  OUTPUT:                                       ║
║  • GitHub Actions > Artifacts                 ║
║  • GitHub Releases > v1.0.80                  ║
║  • Download APK and install: adb install *.apk
║                                                ║
║  BUILD TIME:                                   ║
║  • First: 20-30 min (cold cache)              ║
║  • Subsequent: 5-10 min (warm cache)          ║
║                                                ║
║  COST:                                         ║
║  • Free (electricity: $5-20/mo)               ║
║  • vs EAS: Saves $240-960/year                ║
║                                                ║
║  TROUBLESHOOTING:                              ║
║  → See LOCAL_BUILD_TROUBLESHOOTING.md          ║
║                                                ║
╚════════════════════════════════════════════════╝
```
