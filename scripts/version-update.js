const fs = require("fs");
const path = require("path");

const appConfigPath = path.join(__dirname, "../app.config.js");
const appConfig = require(appConfigPath);

// Split version into major.minor.patch
const [major, minor, patch] = appConfig.expo.version.split(".").map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

// Update build number (Android versionCode)
const newBuildNumber = (appConfig.expo.android.versionCode || 1) + 1;

const updatedConfig = `export default ${JSON.stringify(
  {
    ...appConfig,
    expo: {
      ...appConfig.expo,
      version: newVersion,
      android: {
        ...appConfig.expo.android,
        versionCode: newBuildNumber,
      },
      ios: {
        ...appConfig.expo.ios,
        buildNumber: newBuildNumber.toString(),
      },
    },
  },
  null,
  2
).replace(/"([^"]+)":/g, "$1:")};`;

fs.writeFileSync(appConfigPath, updatedConfig);
console.log(`Updated to v${newVersion} (build ${newBuildNumber})`);
