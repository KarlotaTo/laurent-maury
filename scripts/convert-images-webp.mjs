/**
 * Convertit les photos du site (public/images) en WebP : 2 000 px maximum, qualité 82.
 * Usage : node scripts/convert-images-webp.mjs  (les originaux JPG/PNG sont supprimés ensuite par git rm)
 */
import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

let before = 0, after = 0;
for (const file of walk("public/images").filter((f) => /\.(jpe?g|png)$/i.test(f))) {
  const out = file.replace(/\.(jpe?g|png)$/i, ".webp");
  const info = await sharp(file).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  const size = statSync(file).size;
  before += size;
  after += info.size;
  console.log(`${file} → ${out}  ${Math.round(size / 1024)} Ko → ${Math.round(info.size / 1024)} Ko (${info.width}×${info.height})`);
}
console.log(`Total : ${Math.round(before / 1024)} Ko → ${Math.round(after / 1024)} Ko (${Math.round((1 - after / before) * 100)} % de moins)`);
