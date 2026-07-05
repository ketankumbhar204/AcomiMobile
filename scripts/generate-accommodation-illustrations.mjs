/**
 * Generates 512×512 isometric accommodation illustration PNGs.
 * Run: node scripts/generate-accommodation-illustrations.mjs
 */
import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src', 'assets', 'accommodation');
const OUT = path.join(ROOT, 'illustrations');
const SPRITES = path.join(ROOT, 'sprites');
const SIZE = 512;

const C = {
  green: '#86efac',
  greenDark: '#4ade80',
  greenLight: '#dcfce7',
  cream: '#faf8f5',
  wall: '#f1f5f9',
  wallDark: '#cbd5e1',
  wood: '#92400e',
  woodLight: '#b45309',
  shadow: 'rgba(15,23,42,0.12)',
  window: '#bae6fd',
  tree: '#22c55e',
  trunk: '#78350f',
  red: '#fca5a5',
  yellow: '#fde047',
  grey: '#d1d5db',
};

async function ensureDirs() {
  for (const sub of ['buildings', 'floors', 'units', 'rooms', 'beds']) {
    await mkdir(path.join(OUT, sub), { recursive: true });
  }
}

function svgWrap(body) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${body}</svg>`,
  );
}

function shadow(cx, cy, rx, ry) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.shadow}"/>`;
}

function isoFace(points, fill, stroke = '#94a3b8', sw = 1.5) {
  return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

function tree(x, y, scale = 1) {
  const s = scale;
  return `
    <rect x="${x - 4 * s}" y="${y}" width="${8 * s}" height="${18 * s}" rx="2" fill="${C.trunk}"/>
    <ellipse cx="${x}" cy="${y - 6 * s}" rx="${16 * s}" ry="${20 * s}" fill="${C.tree}"/>
    <ellipse cx="${x - 8 * s}" cy="${y - 2 * s}" rx="${10 * s}" ry="${12 * s}" fill="${C.greenDark}"/>
  `;
}

function windowGrid(x, y, cols, rows, w, h, gap) {
  let s = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + c * (w + gap);
      const wy = y + r * (h + gap);
      s += `<rect x="${wx}" y="${wy}" width="${w}" height="${h}" rx="2" fill="${C.window}" stroke="#64748b" stroke-width="1"/>`;
    }
  }
  return s;
}

function svgBuilding(variant = 'apartment') {
  const accent =
    variant === 'hostel'
      ? '#fef3c7'
      : variant === 'pg'
        ? '#d1fae5'
        : variant === 'commercial'
          ? '#e2e8f0'
          : '#ffffff';

  const floors = variant === 'hostel' ? 5 : variant === 'commercial' ? 6 : 4;
  const bw = variant === 'commercial' ? 200 : 170;
  const bh = 40 + floors * 36;
  const cx = 256;
  const baseY = 400;
  const left = cx - bw / 2;
  const top = baseY - bh;

  let body = shadow(cx, baseY + 18, 140, 22);
  body += tree(90, baseY - 10, 1.1);
  body += tree(420, baseY - 8, 1);

  // isometric block: front + left + top
  body += isoFace(
    `${left},${top + 20} ${left + bw},${top + 20} ${left + bw},${baseY} ${left},${baseY}`,
    accent,
  );
  body += isoFace(
    `${left},${top + 20} ${left - 36},${top} ${left - 36},${baseY - 20} ${left},${baseY}`,
    C.wallDark,
  );
  body += isoFace(
    `${left},${top + 20} ${left + bw},${top + 20} ${left + bw - 36},${top} ${left - 36},${top}`,
    C.greenLight,
  );

  body += windowGrid(left + 24, top + 48, 3, floors, 28, 22, 10);
  body += `<rect x="${left + 70}" y="${baseY - 44}" width="36" height="44" rx="3" fill="${C.wood}" stroke="#444" stroke-width="1.5"/>`;
  body += `<rect x="${left + 82}" y="${baseY - 30}" width="12" height="18" rx="1" fill="#fde68a"/>`;

  if (variant === 'pg') {
    body += `<rect x="${left + bw - 40}" y="${top + 30}" width="28" height="18" rx="4" fill="${C.greenDark}" opacity="0.85"/>`;
  }
  if (variant === 'hostel') {
    body += `<text x="${left + 20}" y="${top + 42}" font-size="14" font-weight="700" fill="#166534" font-family="sans-serif">PG</text>`;
  }

  return svgWrap(body);
}

function svgFloor(units = 4, style = 'apartment') {
  const cx = 256;
  const cy = 280;
  const plate = 220;
  let body = shadow(cx, 390, 130, 20);
  body += isoFace(
    `${cx - plate / 2},${cy + 30} ${cx + plate / 2},${cy + 30} ${cx + plate / 2 + 40},${cy} ${cx - plate / 2 + 40},${cy}`,
    C.cream,
  );
  body += isoFace(
    `${cx - plate / 2},${cy + 30} ${cx - plate / 2 + 40},${cy} ${cx - plate / 2 + 40},${cy - 80} ${cx - plate / 2},${cy - 50}`,
    C.wallDark,
    '#94a3b8',
    1,
  );

  const cols = units <= 4 ? 2 : units <= 6 ? 3 : 4;
  const rows = Math.ceil(units / cols);
  const cellW = (plate - 24) / cols;
  const cellH = 70 / rows;

  for (let i = 0; i < units; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ux = cx - plate / 2 + 12 + col * cellW;
    const uy = cy - 40 + row * cellH;
    body += `<rect x="${ux}" y="${uy}" width="${cellW - 8}" height="${cellH - 6}" rx="4" fill="${style === 'corridor' ? C.greenLight : '#fff'}" stroke="#94a3b8" stroke-width="1.2"/>`;
    body += `<rect x="${ux + 6}" y="${uy + 8}" width="${cellW - 20}" height="8" rx="2" fill="${C.window}"/>`;
  }

  if (style === 'corridor') {
    body += `<rect x="${cx - 8}" y="${cy - 50}" width="16" height="100" fill="${C.wall}" stroke="#94a3b8"/>`;
  }

  return svgWrap(body);
}

function svgUnit(rooms = 4) {
  const cx = 256;
  const cy = 270;
  let body = shadow(cx, 390, 110, 18);
  body += isoFace(
    `${cx - 90},${cy + 40} ${cx + 90},${cy + 40} ${cx + 110},${cy + 10} ${cx - 70},${cy + 10}`,
    '#fff',
  );
  body += isoFace(
    `${cx - 90},${cy + 40} ${cx - 70},${cy + 10} ${cx - 70},${cy - 60} ${cx - 90},${cy - 30}`,
    C.wallDark,
  );

  const cols = rooms <= 2 ? 2 : rooms <= 4 ? 2 : 3;
  const rows = Math.ceil(rooms / cols);
  const cellW = 160 / cols;
  const cellH = 80 / rows;

  for (let i = 0; i < rooms; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const rx = cx - 80 + col * cellW;
    const ry = cy - 50 + row * cellH;
    body += `<rect x="${rx}" y="${ry}" width="${cellW - 6}" height="${cellH - 6}" rx="3" fill="${C.greenLight}" stroke="#86efac" stroke-width="1"/>`;
    body += `<rect x="${rx + 8}" y="${ry + 10}" width="${cellW - 22}" height="${cellH - 20}" rx="2" fill="#fff" stroke="#cbd5e1" stroke-width="0.8"/>`;
    body += `<rect x="${rx + 12}" y="${ry + 14}" width="14" height="20" rx="2" fill="${C.woodLight}" opacity="0.7"/>`;
  }

  return svgWrap(body);
}

function svgRoom(beds = 2, type = 'SHARED') {
  const cx = 256;
  const cy = 260;
  const tint =
    beds >= 6 || type === 'DORMITORY'
      ? C.yellow
      : beds >= 4
        ? C.red
        : beds >= 3
          ? '#fed7aa'
          : C.greenLight;

  let body = shadow(cx, 390, 100, 16);
  body += isoFace(
    `${cx - 100},${cy + 50} ${cx + 100},${cy + 50} ${cx + 120},${cy + 20} ${cx - 80},${cy + 20}`,
    tint,
  );
  body += isoFace(
    `${cx - 100},${cy + 50} ${cx - 80},${cy + 20} ${cx - 80},${cy - 70} ${cx - 100},${cy - 40}`,
    C.wallDark,
  );
  body += `<rect x="${cx - 60}" y="${cy - 55}" width="50" height="30" rx="2" fill="${C.window}" stroke="#64748b" stroke-width="1"/>`;
  body += `<rect x="${cx + 30}" y="${cy - 30}" width="24" height="18" rx="2" fill="${C.wood}" opacity="0.6"/>`;

  const bedCount = Math.min(beds, 6);
  const cols = bedCount <= 3 ? bedCount : 3;
  const rows = Math.ceil(bedCount / cols);
  for (let i = 0; i < bedCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const bx = cx - 70 + col * 38;
    const by = cy - 10 + row * 34;
    body += `<rect x="${bx}" y="${by}" width="30" height="26" rx="4" fill="#fff" stroke="${C.wood}" stroke-width="1.2"/>`;
    body += `<rect x="${bx + 3}" y="${by + 3}" width="24" height="8" rx="2" fill="#f8fafc"/>`;
    body += `<rect x="${bx + 3}" y="${by + 12}" width="24" height="11" rx="2" fill="${C.green}"/>`;
  }

  return svgWrap(body);
}

async function writeSvg(name, subdir, svg) {
  const outPath = path.join(OUT, subdir, name);
  await sharp(svg).resize(SIZE, SIZE).png().toFile(outPath);
  console.log('wrote', outPath);
}

async function copyBedSprites() {
  const pairs = [
    ['bed-available.png', 'bed-available.png'],
    ['bed-reserved.png', 'bed-reserved.png'],
    ['bed-occupied.png', 'bed-occupied.png'],
    ['bed-maintenance.png', 'bed-maintenance.png'],
  ];
  for (const [src, dest] of pairs) {
    const srcPath = path.join(SPRITES, src);
    const destPath = path.join(OUT, 'beds', dest);
    try {
      await sharp(srcPath).resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(destPath);
      console.log('wrote', destPath);
    } catch {
      console.log('skip', dest, '(source missing)');
    }
  }
}

async function main() {
  await ensureDirs();

  for (const v of ['apartment', 'pg', 'hostel', 'commercial']) {
    await writeSvg(`${v}-building.png`, 'buildings', svgBuilding(v));
  }

  await writeSvg('floor-4-units.png', 'floors', svgFloor(4, 'apartment'));
  await writeSvg('floor-6-units.png', 'floors', svgFloor(6, 'apartment'));
  await writeSvg('floor-8-units.png', 'floors', svgFloor(8, 'apartment'));
  await writeSvg('floor-corridor.png', 'floors', svgFloor(8, 'corridor'));
  await writeSvg('floor-apartment.png', 'floors', svgFloor(4, 'apartment'));
  await writeSvg('floor-hostel.png', 'floors', svgFloor(6, 'hostel'));

  for (const n of [2, 4, 6, 8]) {
    await writeSvg(`unit-${n}-room.png`, 'units', svgUnit(n));
  }

  await writeSvg('room-single.png', 'rooms', svgRoom(1, 'PRIVATE'));
  await writeSvg('room-double.png', 'rooms', svgRoom(2, 'SHARED'));
  await writeSvg('room-triple.png', 'rooms', svgRoom(3, 'SHARED'));
  await writeSvg('room-quad.png', 'rooms', svgRoom(4, 'SHARED'));
  await writeSvg('room-dormitory.png', 'rooms', svgRoom(8, 'DORMITORY'));

  await copyBedSprites();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
