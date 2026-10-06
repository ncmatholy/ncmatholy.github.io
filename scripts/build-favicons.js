/* Export browser/search icons from the same centered SVG used by the site. */
const { existsSync } = require('node:fs');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const output = path.resolve(__dirname, '..', 'output');
const sizes = [16, 32, 48, 96];

async function buildFavicons() {
  const svg = await readFile(path.join(output, 'static', 'mark.svg'), 'utf8');
  const executablePath = process.env.CHROMIUM_PATH ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({ executablePath });
  const images = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 96, height: 96 },
      deviceScaleFactor: 1,
    });
    for (const size of sizes) {
      await page.setContent(`<style>
        html, body { margin: 0; background: transparent; }
        svg { display: block; width: ${size}px; height: ${size}px; }
      </style>${svg}`);
      images.push(await page.locator('svg').screenshot({ omitBackground: true }));
    }
  } finally {
    await browser.close();
  }

  // ICO supports embedded PNG frames, allowing each tab size to stay sharp.
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length + sizes.length * 16;
  const entries = images.map((image, index) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(sizes[index], 0);
    entry.writeUInt8(sizes[index], 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.length;
    return entry;
  });
  await writeFile(path.join(output, 'favicon.ico'), Buffer.concat([header, ...entries, ...images]));
  await writeFile(path.join(output, 'favicon-96.png'), images[images.length - 1]);
  await writeFile(path.join(output, 'static', 'favicon.svg'), svg);
  console.log('Exported favicon.ico (16/32/48/96px), favicon-96.png, and the legacy SVG alias.');
}

buildFavicons().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
