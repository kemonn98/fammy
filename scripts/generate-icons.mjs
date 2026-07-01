import { mkdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const source = join(process.cwd(), "public", "fammy-profile.png");
const iconsDir = join(process.cwd(), "public", "icons");
const publicDir = join(process.cwd(), "public");

mkdirSync(iconsDir, { recursive: true });

const outputs = [
  { path: join(iconsDir, "icon-192.png"), size: 192 },
  { path: join(iconsDir, "icon-512.png"), size: 512 },
  { path: join(iconsDir, "apple-touch-icon.png"), size: 180 },
  { path: join(publicDir, "favicon.png"), size: 32 },
];

for (const { path, size } of outputs) {
  await sharp(source).resize(size, size).png().toFile(path);
}

console.log("Icons generated from public/fammy-profile.png");
