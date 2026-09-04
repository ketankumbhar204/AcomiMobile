#!/usr/bin/env node
'use strict';

/**
 * apply-natural-translations.cjs
 *
 * Applies natural Hindi + Marathi translations from natural-ui-translations.json
 * into the Mobile (and optionally Web) locale files.
 *
 * Usage:
 *   node scripts/apply-natural-translations.cjs
 *   node scripts/apply-natural-translations.cjs --web
 *
 * Rules:
 *   - byKey: only sets target[key] if target[key] === en[key] (still English) or missing
 *   - byExactEnglish: walks all leaf values; only replaces if leaf === englishPhrase
 *                     AND the same path in en.json also equals that phrase
 *   - NEVER overwrites a value that already differs from English
 *   - Writes files back pretty-printed with trailing newline
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const includeWeb = argv.includes('--web');

const ROOT = path.resolve(__dirname, '..');
const TRANSLATIONS_FILE = path.join(__dirname, 'natural-ui-translations.json');

const LOCALES = ['hi', 'mr'];

const TARGETS = [
  {
    label: 'Mobile',
    dir: path.join(ROOT, 'src', 'i18n', 'locales'),
  },
];

if (includeWeb) {
  // Adjust this path if your Web locales live elsewhere
  const webDir = path.join(ROOT, '..', 'AcomiWeb', 'src', 'i18n', 'locales');
  if (fs.existsSync(webDir)) {
    TARGETS.push({ label: 'Web', dir: webDir });
  } else {
    console.warn('[warn] --web flag set but Web locales dir not found:', webDir);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/** Flatten a nested object to dot-notation keys */
function flatten(obj, prefix) {
  prefix = prefix || '';
  const result = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? prefix + '.' + k : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flatten(v, key));
    } else {
      result[key] = v;
    }
  }
  return result;
}

/** Get a nested value by dot-path */
function getByPath(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

/** Set a nested value by dot-path, creating intermediate objects */
function setByPath(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object') {
      cur[p] = {};
    }
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

/**
 * Walk all leaf values of an object, calling callback(path, value) for each.
 * path is an array of string keys.
 */
function walkLeaves(obj, callback, pathArr) {
  pathArr = pathArr || [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const newPath = pathArr.concat(k);
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      walkLeaves(v, callback, newPath);
    } else {
      callback(newPath, v);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const translations = readJson(TRANSLATIONS_FILE);
const { byKey, byExactEnglish } = translations;

for (const target of TARGETS) {
  console.log('\n=== Processing:', target.label, '===');

  const enFile = path.join(target.dir, 'en.json');
  if (!fs.existsSync(enFile)) {
    console.warn('  [skip] en.json not found at', enFile);
    continue;
  }
  const en = readJson(enFile);
  const flatEn = flatten(en);

  for (const locale of LOCALES) {
    const localeFile = path.join(target.dir, locale + '.json');
    if (!fs.existsSync(localeFile)) {
      console.warn('  [skip]', locale + '.json not found at', localeFile);
      continue;
    }

    const localeData = readJson(localeFile);
    let keysUpdated = 0;
    let phraseUpdated = 0;
    let preserved = 0;

    // ---- byKey pass -------------------------------------------------------
    for (const [dotKey, translations_for_key] of Object.entries(byKey)) {
      const translation = translations_for_key[locale];
      if (!translation) continue;

      const enValue = flatEn[dotKey];
      const currentValue = getByPath(localeData, dotKey);

      if (enValue === undefined) {
        // Key not present in en.json — skip silently
        continue;
      }

      if (currentValue === undefined || currentValue === enValue) {
        // Missing or still matches English → apply
        setByPath(localeData, dotKey, translation);
        keysUpdated++;
      } else {
        // Already differs from English → preserve
        preserved++;
      }
    }

    // ---- byExactEnglish pass ----------------------------------------------
    walkLeaves(localeData, function(pathArr, currentValue) {
      if (typeof currentValue !== 'string') return;

      const dotKey = pathArr.join('.');
      const enValue = flatEn[dotKey];

      // For each byExactEnglish phrase, check if this leaf equals the English phrase
      for (const [enPhrase, phraseTranslations] of Object.entries(byExactEnglish)) {
        const phraseTranslation = phraseTranslations[locale];
        if (!phraseTranslation) continue;

        if (currentValue === enPhrase && enValue === enPhrase) {
          // Still equals English phrase → replace
          setByPath(localeData, dotKey, phraseTranslation);
          phraseUpdated++;
          break; // Only apply one phrase match per leaf
        }
      }
    });

    writeJson(localeFile, localeData);

    console.log(
      '  [' + locale + ']',
      'keysUpdated=' + keysUpdated,
      'phraseUpdated=' + phraseUpdated,
      'preserved=' + preserved
    );
  }
}

console.log('\nDone.');
