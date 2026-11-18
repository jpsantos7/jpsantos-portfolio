// Renders the PNGs and the .ico from the SVGs that scripts/generate-icons.py writes.
// Usage: node scripts/render-icons.mjs <svg dir> <output dir>   (run by the Python script)
// sharp comes with Astro. The .ico is one 32px PNG-in-ICO image, built by hand.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [from, to] = process.argv.slice(2);
const svg = (name) => readFileSync(join(from, `${name}.svg`));
const png = (name, size) =>
  sharp(svg(name), { density: (72 * size) / 100 })
    .resize(size, size)
    .png()
    .toBuffer();

writeFileSync(join(to, "apple-touch-icon.png"), await png("large", 180));
writeFileSync(join(to, "icon-192.png"), await png("large", 192));
writeFileSync(join(to, "icon-512.png"), await png("large", 512));
writeFileSync(join(to, "icon-maskable-512.png"), await png("maskable", 512));

const image = await png("small", 32);
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
header[6] = 32; // width
header[7] = 32; // height
header.writeUInt16LE(1, 10); // colour planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(image.length, 14);
header.writeUInt32LE(22, 18); // image offset
writeFileSync(join(to, "favicon.ico"), Buffer.concat([header, image]));
