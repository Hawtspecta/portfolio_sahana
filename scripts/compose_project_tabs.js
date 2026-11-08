const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'public', 'assets');
const baseTabPath = path.join(assetsDir, 'project_tab.png');

const sites = [
  { name: 'project_tab_lawbot' },
  { name: 'project_tab_ufi' },
  { name: 'project_tab_brew' },
  { name: 'project_tab_india' },
  { name: 'project_tab_resume' }
];

async function main() {
  const baseMeta = await sharp(baseTabPath).metadata();
  console.log('Base tab dimensions:', baseMeta.width, baseMeta.height);

  // 2x Retina 4K tab dimensions: 3548 x 1774
  const scale = 2;
  const W = baseMeta.width * scale;
  const H = baseMeta.height * scale;

  const left = 70 * scale;   // 140
  const top = 278 * scale;   // 556
  const width = 1636 * scale; // 3272
  const height = 524 * scale; // 1048

  // Upscale base tab frame with lanczos3 for maximum crispness
  const baseBuf = await sharp(baseTabPath)
    .resize(W, H, { kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const baseData = baseBuf.data;

  for (const s of sites) {
    const rawShotPath = path.join(assetsDir, `raw_${s.name}.png`);
    const rawShotWebpPath = path.join(assetsDir, `raw_${s.name}.webp`);
    const outComposedWebpPath = path.join(assetsDir, `${s.name}.webp`);
    const outComposedPngPath = path.join(assetsDir, `${s.name}.png`);

    console.log('Compositing 4K Retina Tab to WebP:', s.name);

    // 1. Also convert raw full screenshot to high quality WebP for ScrollExpand
    await sharp(rawShotPath)
      .webp({ quality: 95, effort: 6 })
      .toFile(rawShotWebpPath);
    console.log('Created raw WebP:', rawShotWebpPath, fs.statSync(rawShotWebpPath).size);

    // Resize raw screenshot to cover the 3272x1048 window using lanczos3
    const shotResizedBuf = await sharp(rawShotPath)
      .resize(width, height, { fit: 'cover', position: 'top', kernel: 'lanczos3' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const shotData = shotResizedBuf.data;

    // Create target buffer initialized to a clone of baseData
    const outData = Buffer.from(baseData);

    for (let dy = 0; dy < height; dy++) {
      const cy = top + dy;
      if (cy >= H) break;
      for (let dx = 0; dx < width; dx++) {
        const cx = left + dx;
        if (cx >= W) break;

        const baseIdx = (cy * W + cx) * 4;
        const shotIdx = (dy * width + dx) * 4;

        // If the base tab is transparent or semi-transparent in this window region,
        // fill it with the crystal-clear 4K screenshot
        const baseAlpha = baseData[baseIdx + 3];
        if (baseAlpha < 200) {
          outData[baseIdx] = shotData[shotIdx];         // R
          outData[baseIdx + 1] = shotData[shotIdx + 1]; // G
          outData[baseIdx + 2] = shotData[shotIdx + 2]; // B
          outData[baseIdx + 3] = 255;                   // A
        }
      }
    }

    // 2. Export 4K tab as WebP with 100% Bit-Exact Lossless Quality
    await sharp(outData, {
      raw: { width: W, height: H, channels: 4 }
    })
    .webp({ lossless: true, effort: 4 })
    .toFile(outComposedWebpPath);

    // 3. Keep PNG as backup
    await sharp(outData, {
      raw: { width: W, height: H, channels: 4 }
    })
    .png({ compressionLevel: 6 })
    .toFile(outComposedPngPath);

    console.log('Successfully created WebP Tab:', outComposedWebpPath, fs.statSync(outComposedWebpPath).size);
  }
}

main().catch(console.error);
