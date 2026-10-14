import Paper from 'paper';
import { ARTBOARD_SIZE, artboardRect } from '../geometry/artboard';
import { buildSeamOutlines, buildSilhouette } from '../geometry/engine';
import type { CutOp } from '../geometry/types';

export type ExportFormat = 'png' | 'svg';
export type ExportBackground = 'white' | 'transparent';

export interface ExportConfig {
  format: ExportFormat;
  background: ExportBackground;
  scale: number;
  includeSeams: boolean;
}

export const DEFAULT_EXPORT: ExportConfig = {
  format: 'png',
  background: 'white',
  scale: 2,
  includeSeams: false,
};

type ExportScope = InstanceType<typeof Paper.PaperScope>;

function createExportScope(): ExportScope {
  const scope = new Paper.PaperScope();
  scope.setup(new scope.Size(ARTBOARD_SIZE, ARTBOARD_SIZE));
  scope.settings.insertItems = false;
  return scope;
}

/**
 * Populate a fresh Paper scope with the export artwork (full artboard): an
 * optional white background, the black silhouette, and optional seam lines.
 * Excludes the on-screen preview/overlay. Kept separate from the live scene.
 */
export function buildExportScene(ops: readonly CutOp[], config: ExportConfig): ExportScope {
  const scope = createExportScope();
  const layer = scope.project.activeLayer;

  if (config.background === 'white') {
    const background = new scope.Path.Rectangle(artboardRect());
    background.fillColor = new scope.Color('#ffffff');
    background.name = 'background';
    layer.addChild(background);
  }

  const silhouette = buildSilhouette(scope, ops);
  silhouette.fillColor = new scope.Color('#111111');
  silhouette.name = 'silhouette';
  layer.addChild(silhouette);

  if (config.includeSeams) {
    const color = new scope.Color('#9ca3af');
    color.alpha = 0.9;
    for (const outline of buildSeamOutlines(scope, ops)) {
      outline.fillColor = null;
      outline.strokeColor = color;
      outline.strokeWidth = 1;
      outline.name = 'seam';
      layer.addChild(outline);
    }
  }

  return scope;
}

/** Build the export artwork and return it as SVG markup. Browser only. */
export function exportSvg(ops: readonly CutOp[], config: ExportConfig): string {
  const scope = buildExportScene(ops, config);
  try {
    const svg = scope.project.exportSVG({
      asString: true,
      matchColors: true,
      bounds: new scope.Rectangle(0, 0, ARTBOARD_SIZE, ARTBOARD_SIZE),
    });
    if (typeof svg !== 'string') throw new Error('Paper did not return an SVG string');
    return svg;
  } finally {
    scope.project.remove();
  }
}

/** Rasterize SVG markup to a PNG blob at the given scale. Browser only. */
export async function rasterizeSvg(svg: string, scale: number): Promise<Blob> {
  const size = Math.round(ARTBOARD_SIZE * scale);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Failed to load SVG for rasterization'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D canvas context');
    context.drawImage(image, 0, 0, size, size);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG encoding failed');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** `notan-<format>-<yyyyMMdd-HHmmss>.<ext>` */
export function exportFilename(format: ExportFormat, date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `notan-${format}-${stamp}.${format}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Export and trigger a browser download. Browser only. */
export async function runExport(ops: readonly CutOp[], config: ExportConfig): Promise<void> {
  const svg = exportSvg(ops, config);

  if (config.format === 'svg') {
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), exportFilename('svg'));
    return;
  }

  const png = await rasterizeSvg(svg, config.scale);
  downloadBlob(png, exportFilename('png'));
}
