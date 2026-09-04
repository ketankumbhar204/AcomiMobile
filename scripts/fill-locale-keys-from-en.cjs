/**
 * Deep-merge English locale leaves into a target locale.
 * Preserves existing target strings; fills missing keys from English.
 * Usage: node scripts/fill-locale-keys-from-en.mjs <appRoot> <localeCode>
 * Example: node scripts/fill-locale-keys-from-en.mjs K:/AcomiMobile hi
 */
const fs = require('fs');
const path = require('path');

const appRoot = process.argv[2];
const locale = process.argv[3];

if (!appRoot || !locale) {
  console.error('Usage: node scripts/fill-locale-keys-from-en.mjs <appRoot> <locale>');
  process.exit(1);
}

const localesDir = path.join(appRoot, 'src', 'i18n', 'locales');
const enPath = path.join(localesDir, 'en.json');
const targetPath = path.join(localesDir, `${locale}.json`);

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Merge English tree into target. Existing target leaf strings win.
 * Arrays: use target if present, else English.
 */
function mergeFromEnglish(enNode, targetNode) {
  if (typeof enNode === 'string') {
    return typeof targetNode === 'string' ? targetNode : enNode;
  }
  if (Array.isArray(enNode)) {
    return Array.isArray(targetNode) ? targetNode : enNode;
  }
  if (!isPlainObject(enNode)) {
    return targetNode === undefined ? enNode : targetNode;
  }

  const out = {};
  const targetObj = isPlainObject(targetNode) ? targetNode : {};
  for (const key of Object.keys(enNode)) {
    out[key] = mergeFromEnglish(enNode[key], targetObj[key]);
  }
  // Keep locale-only keys that English does not have (rare).
  for (const key of Object.keys(targetObj)) {
    if (!(key in out)) {
      out[key] = targetObj[key];
    }
  }
  return out;
}

function leafCount(value, prefix = '') {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? 1 : 0;
  }
  return Object.entries(value).reduce(
    (sum, [key, child]) => sum + leafCount(child, prefix ? `${prefix}.${key}` : key),
    0,
  );
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
const before = leafCount(target);
const merged = mergeFromEnglish(en, target);
const after = leafCount(merged);
const enCount = leafCount(en);

fs.writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      app: appRoot,
      locale,
      enLeaves: enCount,
      beforeLeaves: before,
      afterLeaves: after,
      filledApprox: after - before,
    },
    null,
    2,
  ),
);
