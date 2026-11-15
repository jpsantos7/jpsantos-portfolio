// PROTOTYPE 022 - throwaway. Renders 12 OG cards (3 surfaces x 4 cards) with Satori + resvg.
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const f = (pkg, file) => readFileSync(new URL(`./node_modules/@fontsource/${pkg}/files/${file}`, import.meta.url));
const fonts = [
  { name: 'Bricolage Grotesque', data: f('bricolage-grotesque', 'bricolage-grotesque-latin-800-normal.woff'), weight: 800, style: 'normal' },
  { name: 'Geist', data: f('geist', 'geist-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Geist Mono', data: f('geist-mono', 'geist-mono-latin-500-normal.woff'), weight: 500, style: 'normal' },
];

// ALL TEXT IS STAND-IN
const cards = [
  { id: 'home', h: 'João Santos', s: 'Design Engineer' },
  { id: 'cs-account-opening', h: 'Account opening for a retail bank', s: "Became the bank's blueprint for new Angular projects" },
  { id: 'cs-bion', h: 'BION / Access', s: 'Rebuilt the front end the design system now stands on' },
  { id: 'cs-email-builder', h: 'Email builder', s: 'Made email work one developer can take on' },
];
const surfaces = {
  a: { bg: '#f2c200', fg: '#161412' },
  b: { bg: '#161412', fg: '#f1ede5' },
  c: { bg: '#f7f4ed', fg: '#161412' },
};
const YELLOW = '#f2c200';
const PAD = 72, W = 1200, H = 630, TEXT_W = W - PAD * 2;
const HS = { size: 96, lh: 1.0, max: 2 };
const SS = { size: 38, lh: 1.3, max: 2 };

const hStyle = (fg) => ({ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: HS.size, lineHeight: HS.lh, letterSpacing: '-0.045em', color: fg });
const sStyle = (fg) => ({ fontFamily: 'Geist', fontWeight: 400, fontSize: SS.size, lineHeight: SS.lh, color: fg });

const el = (type, style, children) => ({ type, props: { style: { display: 'flex', ...style }, children } });

function tree(card, key) {
  const { bg, fg } = surfaces[key];
  const kids = [
    el('div', { fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 24, letterSpacing: '0.14em', color: fg }, 'JPSANTOS.EU'),
  ];
  if (key === 'c') kids.push(el('div', { position: 'absolute', top: 0, right: PAD, width: 168, height: 232, background: YELLOW }, ''));
  const bottom = [];
  if (key === 'b') bottom.push(el('div', { width: 96, height: 12, background: YELLOW, marginBottom: 36 }, ''));
  bottom.push(el('div', { ...hStyle(fg), width: TEXT_W }, card.h));
  bottom.push(el('div', { ...sStyle(fg), width: TEXT_W, marginTop: 28 }, card.s));
  kids.push(el('div', { flexDirection: 'column', flexShrink: 0 }, bottom));
  return el('div', { position: 'relative', width: W, height: H, background: bg, flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', padding: PAD }, kids);
}

// Overflow probe: lay the text out at the real width with no fixed height, read the SVG height, divide by line height.
async function lineCount(text, st) {
  const node = el('div', { ...st, width: TEXT_W }, text);
  const svg = await satori(node, { width: TEXT_W, fonts });
  const h = Number(/<svg[^>]*height="([\d.]+)"/.exec(svg)[1]);
  return Math.round(h / (st.fontSize * st.lineHeight));
}

mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
const failures = [];
for (const c of cards) {
  const hl = await lineCount(c.h, hStyle('#000'));
  const sl = await lineCount(c.s, sStyle('#000'));
  if (hl > HS.max) failures.push(`${c.id}: headline wraps to ${hl} lines (max ${HS.max})`);
  if (sl > SS.max) failures.push(`${c.id}: subtitle wraps to ${sl} lines (max ${SS.max})`);
}
if (failures.length) { console.error('OVERFLOW:\n' + failures.join('\n')); process.exit(1); }

for (const key of Object.keys(surfaces)) for (const c of cards) {
  const svg = await satori(tree(c, key), { width: W, height: H, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  writeFileSync(new URL(`./out/${key}-${c.id}.png`, import.meta.url), png);
}
console.log('wrote 12 PNGs to out/');
