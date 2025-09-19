// Prepare google-services.json from env variables for Android builds.
// Priority:
// 1. GOOGLE_SERVICES_JSON_BASE64 (base64 encoded content)
// 2. (deprecated) GOOGLE_SERVICES_JSON (raw JSON string or file path)
// Output: ./google-services.json (git ignored)

const fs = require('fs');
const crypto = require('crypto');

const TARGET = './google-services.json';
const BASE64 = process.env.GOOGLE_SERVICES_JSON_BASE64 || process.env.GOOGLE_SERVICES_BASE64; // legacy alias
const LEGACY_INLINE = process.env.GOOGLE_SERVICES_JSON; // deprecated

const isLikelyJson = (str) => !!str && str.trim().startsWith('{') && str.trim().endsWith('}');
const sha256 = (d) => crypto.createHash('sha256').update(d).digest('hex').slice(0, 12);

function writeFileIfChanged(path, content) {
  if (fs.existsSync(path)) {
    const existing = fs.readFileSync(path, 'utf8');
    if (existing === content) return false; // unchanged
  }
  fs.writeFileSync(path, content, 'utf8');
  return true;
}

function handleBase64(b64) {
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  if (!isLikelyJson(decoded)) {
    throw new Error('Decoded content is not valid JSON');
  }
  const changed = writeFileIfChanged(TARGET, decoded);
  console.log(`✅ google-services.json from BASE64 (${changed ? 'written' : 'unchanged'}) sha=${sha256(decoded)}`);
  return true;
}

function handleInline(value) {
  if (isLikelyJson(value)) {
    const changed = writeFileIfChanged(TARGET, value);
    console.log(`✅ google-services.json from inline JSON (${changed ? 'written' : 'unchanged'}) sha=${sha256(value)}`);
    return true;
  }
  if (fs.existsSync(value)) {
    const fileContent = fs.readFileSync(value, 'utf8');
    if (!isLikelyJson(fileContent)) {
      console.warn('⚠️ Referenced file content does not look like JSON.');
    }
    const changed = writeFileIfChanged(TARGET, fileContent);
    console.log(`✅ google-services.json copied from path (${changed ? 'written' : 'unchanged'}) sha=${sha256(fileContent)}`);
    return true;
  }
  console.warn('⚠️ Inline var not JSON and path not found:', value);
  return false;
}

function main() {
  try {
    if (BASE64) {
      handleBase64(BASE64);
      return;
    }
    if (LEGACY_INLINE) {
      handleInline(LEGACY_INLINE);
      return;
    }
    if (fs.existsSync(TARGET)) {
      const existing = fs.readFileSync(TARGET, 'utf8');
      console.log(`ℹ️ Using existing google-services.json sha=${sha256(existing)}`);
    } else {
      console.log('ℹ️ No env provided; google-services.json not generated (expected in local dev or provided later).');
    }
  } catch (err) {
    console.error('❌ Failed preparing google-services.json:', err.message || err);
    process.exit(1);
  }
}

main();
