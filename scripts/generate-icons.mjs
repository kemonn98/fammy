import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// Minimal 1x1 PNG (valid) — replaced by generate-icons for production
const MINI_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const dir = join(process.cwd(), "public", "icons");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "icon-192.png"), MINI_PNG);
writeFileSync(join(dir, "icon-512.png"), MINI_PNG);
console.log("Icons created in public/icons/");
