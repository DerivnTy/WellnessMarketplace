import {mkdir, readdir, readFile, rename, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceDir = path.join(root, 'assets/product-sources');
const publicDir = path.join(root, 'public/products');
const outDir = path.join(publicDir, 'opt');
const manifestPath = path.join(root, 'data/image-manifest.json');
const raster = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const widths = [320, 640, 960];
const cardLimit = 150 * 1024;

await mkdir(sourceDir, {recursive: true});
await mkdir(outDir, {recursive: true});

for (const name of await readdir(publicDir)) {
  const ext = path.extname(name).toLowerCase();
  if (!raster.has(ext)) continue;
  const from = path.join(publicDir, name);
  const to = path.join(sourceDir, name);
  try {
    await stat(to);
  } catch {
    await rename(from, to);
  }
}

async function encode(input, width, format) {
  let quality = format === 'avif' ? 42 : 64;
  let buffer = await input.clone().resize({width, withoutEnlargement: true})[format]({quality, effort: format === 'avif' ? 4 : undefined}).toBuffer();
  const limit = width <= 640 ? cardLimit : 220 * 1024;
  while (buffer.length > limit && quality > 28) {
    quality -= 6;
    buffer = await input.clone().resize({width, withoutEnlargement: true})[format]({quality, effort: format === 'avif' ? 4 : undefined}).toBuffer();
  }
  return buffer;
}

const manifest = {};
const names = (await readdir(sourceDir)).filter(name => raster.has(path.extname(name).toLowerCase())).sort();
let oversize = 0;
for (const name of names) {
  const source = path.join(sourceDir, name);
  const image = sharp(source, {failOn: 'none'});
  const meta = await image.metadata();
  const intrinsicWidth = meta.width || 640;
  const intrinsicHeight = meta.height || 640;
  const stem = name.replace(/\.[^.]+$/, '');
  const targets = widths.filter(width => width < intrinsicWidth);
  if (!targets.length || targets.at(-1) !== Math.min(960, intrinsicWidth)) targets.push(Math.min(960, intrinsicWidth));
  const unique = [...new Set(targets)].sort((a, b) => a - b);
  const written = [];
  for (const width of unique) {
    for (const format of ['avif', 'webp']) {
      const buffer = await encode(image, width, format);
      const file = `${stem}-${width}.${format}`;
      await writeFile(path.join(outDir, file), buffer);
      written.push({format, width, bytes: buffer.length});
      if (width <= 640 && buffer.length > cardLimit) oversize += 1;
    }
  }
  manifest['/products/' + name] = {
    width: intrinsicWidth,
    height: intrinsicHeight,
    base: `/products/opt/${stem}`,
    widths: unique,
  };
  const card = written.filter(item => item.width <= 640).sort((a, b) => b.width - a.width || a.bytes - b.bytes)[0];
  console.log(`${name} ${intrinsicWidth}x${intrinsicHeight} card ${card ? Math.round(card.bytes / 1024) + 'KB' : 'n/a'}`);
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${names.length} products. Card variants over 150KB: ${oversize}`);
if (oversize) process.exitCode = 1;
