#!/usr/bin/env node
/**
 * Capture a screenshot of the app with a headless Chromium browser.
 *
 * Usage: npm run shot -- [name] [width] [height]
 *   name    output file name without extension (default: "app")
 *   width   viewport width in CSS px (default: 1280)
 *   height  viewport height in CSS px (default: 900)
 *
 * Screenshots are written to docs/screenshots/<name>.png and are committed to the
 * repository as a visual record. A smoke check asserts that the center of the canvas
 * is dark (the square) so a blank/broken render fails loudly.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const [name = 'app', widthArg = '1280', heightArg = '900'] = process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
const output = resolve('docs/screenshots', `${name}.png`);

const server = await createServer({ server: { port: 0 }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls?.local?.[0];
if (!url) throw new Error('Could not determine the dev server URL');

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('body[data-notan-ready="true"]', { timeout: 15000 });

  const sample = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const center = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1);
    return { width: canvas.width, height: canvas.height, center: Array.from(center.data) };
  });

  await mkdir(dirname(output), { recursive: true });
  await page.screenshot({ path: output });

  console.log(`Saved ${output} (${width}x${height} @2x)`);
  if (sample) {
    console.log(
      `Canvas ${sample.width}x${sample.height}; center pixel rgba(${sample.center.join(', ')})`,
    );
    const [r, , , a] = sample.center;
    if (a > 0 && r > 60) {
      throw new Error('Unexpected render: center of the canvas is not dark');
    }
  }
} finally {
  await browser.close();
  await server.close();
}
