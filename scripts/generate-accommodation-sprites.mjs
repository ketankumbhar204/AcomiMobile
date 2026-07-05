/**
 * Generates flat 2D PNG sprites for accommodation layout mode.
 * Run: node scripts/generate-accommodation-sprites.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'src', 'assets', 'accommodation', 'sprites');

async function ensureDir() {
  await mkdir(OUT, { recursive: true });
}

/** Top-down bed: mattress + pillow block (reference style). */
function bedMarkup(x, y, w, h, pillowAtTop = true) {
  const pillowH = Math.max(4, Math.round(h * 0.22));
  const innerX = x + 2;
  const innerY = y + 2;
  const innerW = w - 4;
  const innerH = h - 4;
  const pillowY = pillowAtTop ? innerY : innerY + innerH - pillowH;
  const mattressY = pillowAtTop ? innerY + pillowH : innerY;
  const mattressH = innerH - pillowH;

  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#ffffff" stroke="#333333" stroke-width="1.5"/>
    <rect x="${innerX}" y="${pillowY}" width="${innerW}" height="${pillowH}" rx="1" fill="#e5e5e5" stroke="#333333" stroke-width="1"/>
    <rect x="${innerX}" y="${mattressY}" width="${innerW}" height="${mattressH}" fill="#fafafa" stroke="#333333" stroke-width="0.75"/>
  `;
}

function svgRoomPlan({ width, height, bedsPerSide }) {
  const wall = 4;
  const innerX = wall + 2;
  const innerY = wall + 2;
  const innerW = width - (wall + 2) * 2;
  const innerH = height - (wall + 2) * 2 - 8;
  const bedW = Math.floor(innerW * 0.18);
  const bedH = Math.floor((innerH - (bedsPerSide - 1) * 3) / bedsPerSide);
  const gap = 3;
  const doorX = width / 2 - 10;

  let beds = '';
  for (let i = 0; i < bedsPerSide; i++) {
    const by = innerY + i * (bedH + gap);
    beds += bedMarkup(innerX + 2, by, bedW, bedH, true);
    beds += bedMarkup(innerX + innerW - bedW - 2, by, bedW, bedH, true);
  }

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="transparent"/>
    <rect x="${wall}" y="${wall}" width="${width - wall * 2}" height="${height - wall * 2}" fill="#f7f7f7" stroke="#555555" stroke-width="3"/>
    ${beds}
    <line x1="${doorX}" y1="${height - wall}" x2="${doorX + 20}" y2="${height - wall}" stroke="#555555" stroke-width="3"/>
    <path d="M ${doorX + 20} ${height - wall} L ${doorX + 20} ${height - wall - 14} A 14 14 0 0 0 ${doorX} ${height - wall - 14} L ${doorX} ${height - wall}" fill="none" stroke="#555555" stroke-width="1.5"/>
  </svg>`);
}

function svgBed() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="64" viewBox="0 0 48 64">
    ${bedMarkup(4, 4, 40, 56, true)}
  </svg>`);
}

function svgRoomSlot() {
  return svgRoomPlan({ width: 120, height: 96, bedsPerSide: 2 });
}

function svgUnitSlot() {
  return svgRoomPlan({ width: 160, height: 120, bedsPerSide: 4 });
}

function svgBuildingShell() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="360" viewBox="0 0 280 360">
    <rect x="24" y="8" width="232" height="344" fill="#f5f5f5" stroke="#333333" stroke-width="2"/>
  </svg>`);
}

function svgDoorFront() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
    <rect x="2" y="2" width="28" height="40" rx="1" fill="#3d5c4a" stroke="#222222" stroke-width="1.5"/>
    <circle cx="26" cy="22" r="2" fill="#c9a227"/>
  </svg>`);
}

function svgEntranceDoors() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48" viewBox="0 0 64 48">
    <rect x="2" y="4" width="28" height="44" rx="1" fill="#555555" stroke="#222" stroke-width="1.5"/>
    <rect x="34" y="4" width="28" height="44" rx="1" fill="#555555" stroke="#222" stroke-width="1.5"/>
    <circle cx="28" cy="26" r="2" fill="#999"/>
    <circle cx="36" cy="26" r="2" fill="#999"/>
  </svg>`);
}

function svgPlantPot() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28">
    <rect x="6" y="20" width="12" height="6" rx="1" fill="#5c4033" stroke="#333" stroke-width="1"/>
    <ellipse cx="12" cy="14" rx="10" ry="12" fill="#6b9e6b" stroke="#333" stroke-width="1"/>
  </svg>`);
}

function svgBalconyRailing() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="16" viewBox="0 0 240 16">
    <line x1="0" y1="4" x2="240" y2="4" stroke="#333" stroke-width="2"/>
    <line x1="0" y1="14" x2="240" y2="14" stroke="#333" stroke-width="2"/>
    <line x1="20" y1="4" x2="20" y2="14" stroke="#333" stroke-width="1"/>
    <line x1="60" y1="4" x2="60" y2="14" stroke="#333" stroke-width="1"/>
    <line x1="100" y1="4" x2="100" y2="14" stroke="#333" stroke-width="1"/>
    <line x1="140" y1="4" x2="140" y2="14" stroke="#333" stroke-width="1"/>
    <line x1="180" y1="4" x2="180" y2="14" stroke="#333" stroke-width="1"/>
    <line x1="220" y1="4" x2="220" y2="14" stroke="#333" stroke-width="1"/>
  </svg>`);
}

/** Empty room shell: walls, windows, door swing, corner cabinets (reference interior). */
function svgRoomInteriorShell() {
  const w = 140;
  const h = 165;
  const wall = 5;
  const ix = wall + 4;
  const iy = wall + 4;
  const iw = w - (wall + 4) * 2;
  const ih = h - (wall + 4) * 2;

  function cabinet(x, y) {
    return `
      <rect x="${x}" y="${y}" width="14" height="14" fill="#d4c4a8" stroke="#333" stroke-width="1"/>
      <line x1="${x + 3}" y1="${y + 7}" x2="${x + 11}" y2="${y + 7}" stroke="#333" stroke-width="0.75"/>
      <line x1="${x + 7}" y1="${y + 3}" x2="${x + 7}" y2="${y + 11}" stroke="#333" stroke-width="0.75"/>
    `;
  }

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="transparent"/>
    <rect x="${wall}" y="${wall}" width="${w - wall * 2}" height="${h - wall * 2}" fill="#fafafa" stroke="#222222" stroke-width="3"/>
    <!-- windows -->
    <line x1="${ix + 20}" y1="${wall}" x2="${ix + 50}" y2="${wall}" stroke="#4a90d9" stroke-width="4"/>
    <line x1="${ix + iw - 50}" y1="${wall}" x2="${ix + iw - 20}" y2="${wall}" stroke="#4a90d9" stroke-width="4"/>
    <line x1="${ix + 20}" y1="${h - wall}" x2="${ix + 50}" y2="${h - wall}" stroke="#4a90d9" stroke-width="4"/>
    <line x1="${ix + iw - 50}" y1="${h - wall}" x2="${ix + iw - 20}" y2="${h - wall}" stroke="#4a90d9" stroke-width="4"/>
    <!-- corner cabinets -->
    ${cabinet(ix + 2, iy + 2)}
    ${cabinet(ix + iw - 16, iy + 2)}
    ${cabinet(ix + 2, iy + ih - 16)}
    <!-- door swing bottom-right -->
    <line x1="${ix + iw - 28}" y1="${h - wall}" x2="${ix + iw - 8}" y2="${h - wall}" stroke="#222" stroke-width="2"/>
    <path d="M ${ix + iw - 8} ${h - wall} L ${ix + iw - 8} ${h - wall - 18} A 18 18 0 0 0 ${ix + iw - 26} ${h - wall - 18} L ${ix + iw - 26} ${h - wall}" fill="none" stroke="#222" stroke-width="1.5"/>
  </svg>`);
}

function svgFloorPlanFourUnits() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#f5f0e6"/>
    <rect x="8" y="8" width="384" height="384" fill="none" stroke="#555555" stroke-width="6"/>
    <!-- central core -->
    <rect x="168" y="168" width="64" height="64" fill="#ebe6dc" stroke="#555555" stroke-width="3"/>
    <line x1="168" y1="200" x2="232" y2="200" stroke="#555555" stroke-width="2"/>
    <line x1="200" y1="168" x2="200" y2="232" stroke="#555555" stroke-width="2"/>
    <!-- stair -->
    <path d="M176 176 L176 224 L192 224 L192 208 L208 208 L208 192 L224 192 L224 176 Z" fill="none" stroke="#666" stroke-width="1.5"/>
    <!-- lift -->
    <rect x="208" y="208" width="16" height="16" fill="none" stroke="#666" stroke-width="1.5"/>
    <line x1="208" y1="208" x2="224" y2="224" stroke="#666" stroke-width="1"/>
    <line x1="224" y1="208" x2="208" y2="224" stroke="#666" stroke-width="1"/>
    <!-- top-left unit -->
    <path d="M14 14 L186 14 L186 164 L164 164 L164 186 L14 186 Z" fill="#f5f0e6" stroke="#555555" stroke-width="4"/>
    <path d="M164 164 A12 12 0 0 1 176 176" fill="none" stroke="#555555" stroke-width="2"/>
    <!-- top-right unit -->
    <path d="M386 14 L214 14 L214 164 L236 164 L236 186 L386 186 Z" fill="#f5f0e6" stroke="#555555" stroke-width="4"/>
    <path d="M236 164 A12 12 0 0 0 224 176" fill="none" stroke="#555555" stroke-width="2"/>
    <!-- bottom-left unit -->
    <path d="M14 386 L14 236 L164 236 L164 214 L186 214 L186 386 Z" fill="#f5f0e6" stroke="#555555" stroke-width="4"/>
    <path d="M164 236 A12 12 0 0 0 176 224" fill="none" stroke="#555555" stroke-width="2"/>
    <!-- bottom-right unit -->
    <path d="M386 386 L236 386 L236 236 L214 236 L214 214 L386 214 Z" fill="#f5f0e6" stroke="#555555" stroke-width="4"/>
    <path d="M236 236 A12 12 0 0 1 224 224" fill="none" stroke="#555555" stroke-width="2"/>
    <!-- outer windows hints -->
    <line x1="40" y1="14" x2="80" y2="14" stroke="#888" stroke-width="3"/>
    <line x1="320" y1="14" x2="360" y2="14" stroke="#888" stroke-width="3"/>
    <line x1="40" y1="386" x2="80" y2="386" stroke="#888" stroke-width="3"/>
    <line x1="320" y1="386" x2="360" y2="386" stroke="#888" stroke-width="3"/>
  </svg>`);
}

const ASSETS = [
  ['bed.png', svgBed()],
  ['room-slot.png', svgRoomSlot()],
  ['unit-slot.png', svgUnitSlot()],
  ['building-shell.png', svgBuildingShell()],
  ['door-front.png', svgDoorFront()],
  ['entrance-doors.png', svgEntranceDoors()],
  ['plant-pot.png', svgPlantPot()],
  ['balcony-railing.png', svgBalconyRailing()],
  ['floor-plan-four-units.png', svgFloorPlanFourUnits()],
  ['room-interior-shell.png', svgRoomInteriorShell()],
];

async function main() {
  await ensureDir();
  for (const [name, svg] of ASSETS) {
    const outPath = path.join(OUT, name);
    await sharp(svg).png().toFile(outPath);
    console.log('wrote', outPath);
  }

  const availableBed = path.join(OUT, 'bed-available.png');
  const maintenanceBed = path.join(OUT, 'bed-maintenance.png');
  try {
    await sharp(availableBed)
      .grayscale()
      .modulate({ brightness: 0.85 })
      .toFile(maintenanceBed);
    console.log('wrote', maintenanceBed);
  } catch {
    console.log('skip bed-maintenance (bed-available.png not found)');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
