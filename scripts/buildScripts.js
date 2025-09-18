const fs = require("fs");
const path = require("path");
const { execSync, execFileSync } = require("child_process");

// Configuration file path
const CONFIG_FILE = path.join(__dirname, 'build-config.json');

// Default configuration
const DEFAULT_CONFIG = {
  scripts: [
    'prepareGoogleServices.js',
    'setupBatteryOptimization.js',
    'notificationSounds.js',
    'setupExceptionHandler.js',
    'setupScreenRecording.js'
  ]
  // You can disable any by: { path: 'setupScreenRecording.js', enabled: false }
};

// Create default config if it doesn't exist
function ensureConfigExists() {
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
        console.log(`Created default build config at ${CONFIG_FILE}`);
    }
}

// Get the list of scripts to run
function getScriptsToRun() {
    ensureConfigExists();
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return config.scripts
        .filter((script) => {
            if (typeof script === 'string') return true;
            return script.enabled !== false;
        })
        .map((script) => {
            if (typeof script === 'string') return script;
            return script.path;
        });
}

// Run all enabled scripts
function runBuildScripts() {
    console.log('🚀 Running build scripts...');

    const scripts = getScriptsToRun();

    scripts.forEach((scriptPath) => {
        const fullPath = path.join(__dirname, scriptPath);

        if (!fs.existsSync(fullPath)) {
            console.error(`❌ Script not found: ${fullPath}`);
            return;
        }

        console.log(`▶️ Running: ${scriptPath}`);

    try {
      if (scriptPath.endsWith(".ts")) {
        // For TypeScript files, use ts-node
        execFileSync("npx", ["ts-node", fullPath], { stdio: "inherit" });
      } else {
        // For JavaScript files, use node
        execFileSync("node", [fullPath], { stdio: "inherit" });
      }
      console.log(`✅ Completed: ${scriptPath}`);
    } catch (error) {
      console.error(`❌ Error running ${scriptPath}:`, error.message);
    }
  });

    console.log('✨ Build scripts completed');
}

// Run the function if this is the main module
if (require.main === module) {
    runBuildScripts();
}

module.exports = runBuildScripts;
