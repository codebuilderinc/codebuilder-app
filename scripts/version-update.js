const path = require("path");
const fs = require("fs");
const { fileURLToPath } = require("url");

// Resolve __dirname in ES module
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

const appConfigPath = path.join(__dirname, "../app.config.js");

// Import `app.config.js` dynamically
const appConfig = require(appConfigPath);

console.log("appConfig", appConfig);

// Split version into major.minor.patch
const [major, minor, patch] = appConfig.expo.version.split(".").map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

// Update build number (Android versionCode)
const newBuildNumber = (appConfig.expo.android.versionCode || 1) + 1;

// Generate updated configuration
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

// Write updated configuration back to file
fs.writeFileSync(appConfigPath, updatedConfig);
console.log(`Updated to v${newVersion} (build ${newBuildNumber})`);
