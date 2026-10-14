#!/usr/bin/env node
/**
 * Capture a screenshot of the app with a headless Chromium browser.
 *
 * Usage: npm run shot -- [name] [width] [height] [interaction]
 *   name         output file name without extension (default: "app")
 *   width        viewport width in CSS px (default: 1280)
 *   height       viewport height in CSS px (default: 900)
 *   interaction  optional; "draw" performs an edge-to-edge cut before capture
 *
 * Screenshots are written to docs/screenshots/<name>.png and are committed to the
 * repository as a visual record. A smoke check asserts that the center of the canvas
 * is dark (the square) so a blank/broken render fails loudly.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const [name = 'app', widthArg = '1280', heightArg = '900', interaction = 'none'] =
  process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
const output = resolve('docs/screenshots', `${name}.png`);

// Mirrors src/lib/geometry/artboard.ts (logical artboard) for input coordinates.
const ARTBOARD_SIZE = 880;
const VIEW_PADDING = 16;

/** Drag a freehand stroke from the square's right edge, bulging inward and back. */
async function drawCut(page) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Canvas not found');

  const scale = Math.min((box.width - VIEW_PADDING * 2) / ARTBOARD_SIZE, (box.height - VIEW_PADDING * 2) / ARTBOARD_SIZE);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Artboard point (x, y) -> screen point.
  const toScreen = (x, y) => ({
    x: centerX + (x - ARTBOARD_SIZE / 2) * scale,
    y: centerY + (y - ARTBOARD_SIZE / 2) * scale,
  });

  // Endpoints on the right edge (x = 640) with a quadratic bulge to the left.
  const start = toScreen(640, 360);
  const end = toScreen(640, 520);
  const control = toScreen(640 - 110, 440);

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const steps = 16;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x;
    const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y;
    await page.mouse.move(x, y);
  }
  await page.mouse.up();
  await page.waitForTimeout(150);
}

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

  if (interaction === 'draw' || interaction === 'commit' || interaction === 'undo' || interaction === 'reload') {
    await drawCut(page);
  }
  if (interaction === 'commit' || interaction === 'undo' || interaction === 'reload') {
    await page.getByRole('button', { name: 'Reflect right' }).click();
    await page.waitForTimeout(150);
  }
  if (interaction === 'undo') {
    await page.getByRole('button', { name: 'Undo' }).click();
    await page.waitForTimeout(150);
  }
  if (interaction === 'reload') {
    await page.waitForTimeout(600); // let the debounced autosave flush
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('body[data-notan-ready="true"]', { timeout: 15000 });
    const undoEnabled = await page.getByRole('button', { name: 'Undo' }).isEnabled();
    console.log(`After reload: Undo enabled = ${undoEnabled}`);
    await page.waitForTimeout(150);
  }

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
