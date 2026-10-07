/**
 * Inventaire des photos d'origine du site (public/images) : dimensions, poids, format.
 * À relancer après tout ajout de photo dans public/images (un test le vérifie).
 * Usage : node scripts/images-manifest.mjs
 */
import sharp from "sharp";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const images = [];
for (const file of walk("public/images").sort()) {
  const meta = await sharp(file).metadata();
  images.push({ url: "/" + file.replace(/^public\//, ""), format: meta.format, width: meta.width, height: meta.height, bytes: statSync(file).size });
}
writeFileSync("src/content/images.json", JSON.stringify(images, null, 2) + "\n");
console.log(`${images.length} photos inventoriées`);
