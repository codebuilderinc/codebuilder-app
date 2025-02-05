#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const semver = require("semver");

// Get bump type from CLI argument, e.g. "major", "minor", or "patch"; default is "patch"
const bumpType = process.argv[2] || "patch";

// 1) Path to version.json
const versionJsonPath = path.join(__dirname, "../version.json");

// 2) Read version.json
const versionData = JSON.parse(fs.readFileSync(versionJsonPath, "utf8"));

// 3) Bump the semver version
const oldVersion = versionData.version || "1.0.0";
const newVersion = semver.inc(oldVersion, bumpType);

// 4) Bump iOS buildNumber
const oldIosBuildNumber = parseInt(versionData.iosBuildNumber || "1", 10);
const newIosBuildNumber = oldIosBuildNumber + 1;

// 5) Bump Android versionCode
const oldAndroidVersionCode = versionData.androidVersionCode || 1;
const newAndroidVersionCode = oldAndroidVersionCode + 1;

// 6) Update the in-memory object
versionData.version = newVersion;
versionData.iosBuildNumber = String(newIosBuildNumber);
versionData.androidVersionCode = newAndroidVersionCode;

// 7) Write back to version.json
fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2), "utf8");

// 8) Console log results
console.log("");
console.log(`✅ Bumped version from ${oldVersion} to ${newVersion}`);
console.log(
  `✅ Bumped iOS buildNumber from ${oldIosBuildNumber} to ${newIosBuildNumber}`
);
console.log(
  `✅ Bumped Android versionCode from ${oldAndroidVersionCode} to ${newAndroidVersionCode}`
);
console.log("");
