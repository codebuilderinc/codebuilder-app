// Prepare google-services.json from env variables for Android builds.
// Priority:
// 1. GOOGLE_SERVICES_JSON_BASE64 (base64 encoded content)
// 2. (deprecated) GOOGLE_SERVICES_JSON (raw JSON string or file path)
// Output: ./google-services.json (git ignored)

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const TARGETS = [
  './google-services.json',
  './android/app/google-services.json',
];
const BASE64 = process.env.GOOGLE_SERVICES_JSON_BASE64 || process.env.GOOGLE_SERVICES_BASE64; // legacy alias
const LEGACY_INLINE = process.env.GOOGLE_SERVICES_JSON; // deprecated

const isLikelyJson = (str) => !!str && str.trim().startsWith('{') && str.trim().endsWith('}');
const sha256 = (d) => crypto.createHash('sha256').update(d).digest('hex').slice(0, 12);

function writeFileIfChanged(path, content) {
  const dir = require('path').dirname(path);
  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(path)) {
    const existing = fs.readFileSync(path, 'utf8');
    if (existing === content) return false; // unchanged
  }
  fs.writeFileSync(path, content, 'utf8');
  return true;
}

function writeTargets(content, sourceLabel) {
  const results = TARGETS.map((target) => ({
    target,
    changed: writeFileIfChanged(target, content),
  }));

  const summary = results
    .map((r) => `${r.target}=${r.changed ? 'written' : 'unchanged'}`)
    .join(', ');
  console.log(`✅ google-services.json from ${sourceLabel} (${summary}) sha=${sha256(content)}`);
}

function validateJson(content) {
  try {
    JSON.parse(content);
  } catch (err) {
    throw new Error(`Content is not parseable JSON: ${err.message || err}`);
  }
}

function handleBase64(b64) {
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  if (!isLikelyJson(decoded)) {
    throw new Error('Decoded content is not valid JSON');
  }
  validateJson(decoded);
  writeTargets(decoded, 'BASE64');
  return true;
}

function handleInline(value) {
  if (isLikelyJson(value)) {
    validateJson(value);
    writeTargets(value, 'inline JSON');
    return true;
  }
  if (fs.existsSync(value)) {
    const fileContent = fs.readFileSync(value, 'utf8');
    if (!isLikelyJson(fileContent)) {
      console.warn('⚠️ Referenced file content does not look like JSON.');
    }
    validateJson(fileContent);
    writeTargets(fileContent, 'path');
    return true;
  }
  console.warn('⚠️ Inline var not JSON and path not found:', value);
  return false;
}

function failIfMissingForAndroidBuild() {
  const androidAppPath = path.resolve('./android/app/google-services.json');
  const androidProjectExists = fs.existsSync(path.resolve('./android/app/build.gradle'));

  if (androidProjectExists && !fs.existsSync(androidAppPath)) {
    throw new Error(
      'android/app/google-services.json is missing. Gradle google-services plugin requires this file.'
    );
  }
}

function main() {
  try {
    if (BASE64) {
      handleBase64(BASE64);
      failIfMissingForAndroidBuild();
      return;
    }
    if (LEGACY_INLINE) {
      handleInline(LEGACY_INLINE);
      failIfMissingForAndroidBuild();
      return;
    }
    const rootTarget = './google-services.json';
    if (fs.existsSync(rootTarget)) {
      const existing = fs.readFileSync(rootTarget, 'utf8');
      validateJson(existing);
      writeTargets(existing, 'existing root file');
      failIfMissingForAndroidBuild();
    } else {
      failIfMissingForAndroidBuild();
      console.log('ℹ️ No env provided; google-services.json not generated (expected in local dev or provided later).');
    }
  } catch (err) {
    console.error('❌ Failed preparing google-services.json:', err.message || err);
    process.exit(1);
  }
}

main();
