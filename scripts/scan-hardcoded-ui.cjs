/**
 * Detect likely user-facing hardcoded English in Mobile src.
 * Focused patterns — avoids TS type noise (Promise<…>, Record<…>).
 *
 * Exit 0 always (report mode). Use --strict to fail over HARDCODE_MAX (default 25).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');

const ALLOW_LINE_RE = [
  /YYYY-MM-DD/,
  /HH:mm/,
  /testID=/,
  /console\./,
  /devLog\(/,
  /defaultValue\s*:/,
  /^\s*\/\//,
  /^\s*\*/,
  /Room \$\{/,
  /Unit \$\{/,
  /\bPromise</,
  /\bRecord</,
  /\bPartial</,
  /\bOmit</,
  /\bPick</,
  /\bArray</,
  /\bMap</,
  /\bSet</,
  /:\s*[A-Z][A-Za-z0-9_<>,\s|]+\s*[;=]/, // type annotations
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(ent.name) && !/\.test\.|__tests__|\.d\.ts$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

const patterns = [
  {
    name: 'jsxText',
    // Closing tag then English words then opening/closing — classic JSX text node.
    re: />\s*[A-Z][A-Za-z]+(?:\s+[A-Za-z']+){0,6}\s*</,
  },
  { name: 'accessibilityLabel', re: /accessibilityLabel=["'][A-Za-z]{3,}/ },
  { name: 'accessibilityHint', re: /accessibilityHint=["'][A-Za-z]{3,}/ },
  { name: 'placeholder', re: /placeholder=["'](?!YYYY)[A-Za-z]{3,}/ },
  {
    name: 'titleProp',
    re: /\btitle:\s*['"][A-Z][a-zA-Z ]{2,}['"]/,
  },
  {
    name: 'returnString',
    // Phrases with a space — skips enum codes (PENDING) and route ids (CompleteProfile).
    re: /return\s+['"][A-Z][A-Za-z]+(?:\s+[A-Za-z']+){1,}['"]/,
  },
];

const files = walk(ROOT);
const hits = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\n/);
  lines.forEach((line, i) => {
    if (ALLOW_LINE_RE.some(re => re.test(line))) return;
    if (/\bt\(|i18n\.t/.test(line)) return;
    for (const { name, re } of patterns) {
      if (re.test(line)) {
        hits.push({
          kind: name,
          file: file.replace(/\\/g, '/'),
          line: i + 1,
          text: line.trim().slice(0, 160),
        });
        break;
      }
    }
  });
}

const payload = { count: hits.length, hits: hits.slice(0, 50) };
console.log(JSON.stringify(payload, null, 2));
if (hits.length > 50) {
  console.log(`...and ${hits.length - 50} more`);
}

const strict = process.argv.includes('--strict');
const maxAllowed = Number(process.env.HARDCODE_MAX || 25);
if (strict && hits.length > maxAllowed) {
  console.error(`Hardcoded UI strings ${hits.length} exceed allow ${maxAllowed}`);
  process.exit(1);
}
