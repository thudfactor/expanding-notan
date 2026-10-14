import Paper from 'paper';
import { ARTBOARD_SIZE, artboardRect, fitScale, squareRect } from '../geometry/artboard';
import {
  buildSeamOutlines,
  buildSilhouette,
  type PaperPathItem,
  type PaperScope,
} from '../geometry/engine';
import { edgeSegment } from '../geometry/math';
import type { CutOp, Edge, Pt } from '../geometry/types';

/** Viewport padding (CSS px) left around the fitted artboard. */
const VIEW_PADDING = 16;
const ACCENT = '#2563eb';

export type PaperProject = InstanceType<typeof Paper.Project>;
export type PaperView = InstanceType<typeof Paper.View>;
export type PaperItem = InstanceType<typeof Paper.Item>;

export interface NotanCanvas {
  readonly scope: PaperScope;
  readonly project: PaperProject;
  readonly view: PaperView;
  /** Rebuild the silhouette and seams from the operation log. */
  setScene(ops: readonly CutOp[], seamVisible: boolean): void;
  /** The current black silhouette, used for snapping and clipping. */
  getSilhouette(): PaperPathItem | undefined;
  /** Draw the in-progress freehand stroke. */
  setLiveStroke(points: readonly Pt[]): void;
  /** Show a resolved cut region preview with its snap points. */
  showPreviewRegion(region: readonly Pt[], snapPoints: readonly Pt[]): void;
  /** Highlight a reflection edge and preview the mirrored placement (or clear). */
  setHover(edge: Edge | null, mirroredRegion: readonly Pt[] | null): void;
  /** Show (or clear, with radius 0) a magnet indicator at the nearest silhouette point. */
  updateDrawSnap(point: Pt, radius: number): void;
  /** Remove any preview overlay. */
  clearPreview(): void;
  /** Fit the artboard into a viewport of the given CSS pixel size. */
  resize(width: number, height: number): void;
  destroy(): void;
}

/**
 * Create the Paper.js scene for the artboard: a white board with the black
 * silhouette derived from the operation log, plus an overlay for interactive
 * previews. Geometry is kept in logical artboard units.
 */
export function createNotanCanvas(canvas: HTMLCanvasElement): NotanCanvas {
  const scope = new Paper.PaperScope();
  scope.setup(canvas);
  scope.settings.insertItems = false;

  const project = scope.project;
  const view = scope.view;
  const layer = project.activeLayer;

  const background = new scope.Path.Rectangle(artboardRect());
  background.fillColor = new scope.Color('#ffffff');
  background.name = 'artboard';
  layer.addChild(background);

  let silhouette: PaperPathItem | undefined;
  let seamGroup: PaperItem | undefined;
  let previewStroke: PaperPathItem | undefined;
  let previewRegion: PaperPathItem | undefined;
  let snapDots: PaperItem | undefined;
  let edgeHighlight: PaperPathItem | undefined;
  let reflectionPreview: PaperPathItem | undefined;
  let drawSnap: PaperItem | undefined;
  let currentOps: readonly CutOp[] = [];

  function bringOverlayForward(): void {
    previewStroke?.bringToFront();
    previewRegion?.bringToFront();
    snapDots?.bringToFront();
  }

  function renderSeams(seamVisible: boolean): void {
    seamGroup?.remove();
    seamGroup = undefined;
    if (!seamVisible) return;

    const color = new scope.Color('#9ca3af');
    color.alpha = 0.9;

    const group = new scope.Group();
    for (const outline of buildSeamOutlines(scope, currentOps)) {
      outline.fillColor = null;
      outline.strokeColor = color;
      outline.strokeWidth = 1.25;
      group.addChild(outline);
    }
    layer.addChild(group);
    seamGroup = group;
  }

  function setScene(ops: readonly CutOp[], seamVisible: boolean): void {
    currentOps = ops;

    silhouette?.remove();
    silhouette = undefined;
    seamGroup?.remove();
    seamGroup = undefined;

    const next = buildSilhouette(scope, ops);
    next.fillColor = new scope.Color('#111111');
    next.name = 'silhouette';
    layer.addChild(next);
    silhouette = next;

    renderSeams(seamVisible);
    bringOverlayForward();
  }

  function getSilhouette(): PaperPathItem | undefined {
    return silhouette;
  }

  function drop(item: PaperItem | undefined): void {
    item?.remove();
  }

  function setLiveStroke(points: readonly Pt[]): void {
    drop(previewStroke);
    previewStroke = undefined;
    if (points.length < 2) return;

    const path = new scope.Path(points.map((point) => [point.x, point.y]));
    path.strokeColor = new scope.Color(ACCENT);
    path.strokeWidth = 1.5;
    path.strokeCap = 'round';
    path.strokeJoin = 'round';
    layer.addChild(path);
    previewStroke = path;
    bringOverlayForward();
  }

  function showPreviewRegion(region: readonly Pt[], snapPoints: readonly Pt[]): void {
    drop(previewStroke);
    drop(previewRegion);
    drop(snapDots);
    previewStroke = undefined;
    previewRegion = undefined;
    snapDots = undefined;
    clearHover();
    clearDrawSnap();

    const fill = new scope.Color(ACCENT);
    fill.alpha = 0.3;

    const regionPath = new scope.Path(region.map((point) => [point.x, point.y]));
    regionPath.closed = true;
    regionPath.fillColor = fill;
    regionPath.strokeColor = new scope.Color(ACCENT);
    regionPath.strokeWidth = 1;
    layer.addChild(regionPath);
    previewRegion = regionPath;

    if (snapPoints.length > 0) {
      const group = new scope.Group();
      for (const point of snapPoints) {
        const dot = new scope.Path.Circle({ center: [point.x, point.y], radius: 5 });
        dot.fillColor = new scope.Color(ACCENT);
        group.addChild(dot);
      }
      layer.addChild(group);
      snapDots = group;
    }

    bringOverlayForward();
  }

  function clearPreview(): void {
    drop(previewStroke);
    drop(previewRegion);
    drop(snapDots);
    previewStroke = undefined;
    previewRegion = undefined;
    snapDots = undefined;
    clearHover();
    clearDrawSnap();
  }

  function clearHover(): void {
    drop(edgeHighlight);
    drop(reflectionPreview);
    edgeHighlight = undefined;
    reflectionPreview = undefined;
  }

  function setHover(edge: Edge | null, mirroredRegion: readonly Pt[] | null): void {
    clearHover();
    if (!edge) {
      bringOverlayForward();
      return;
    }

    // Preview where the mirrored copy would land, at 50% opacity.
    if (mirroredRegion && mirroredRegion.length >= 3) {
      const fill = new scope.Color('#111111');
      fill.alpha = 0.5;
      const preview = new scope.Path(mirroredRegion.map((point) => [point.x, point.y]));
      preview.closed = true;
      preview.fillColor = fill;
      layer.addChild(preview);
      reflectionPreview = preview;
    }

    // Highlight the square edge that will be used as the reflection axis.
    const [from, to] = edgeSegment(edge, squareRect());
    const line = new scope.Path([
      [from.x, from.y],
      [to.x, to.y],
    ]);
    const color = new scope.Color(ACCENT);
    color.alpha = 0.85;
    line.strokeColor = color;
    line.strokeWidth = 8;
    line.strokeCap = 'round';
    layer.addChild(line);
    edgeHighlight = line;

    bringOverlayForward();
    edgeHighlight.bringToFront();
  }

  function clearDrawSnap(): void {
    drop(drawSnap);
    drawSnap = undefined;
  }

  function updateDrawSnap(point: Pt, radius: number): void {
    clearDrawSnap();
    if (!silhouette || radius <= 0) return;

    const target = new scope.Point(point.x, point.y);
    const nearest = silhouette.getNearestPoint(target);
    if (target.getDistance(nearest) > radius) return;

    const group = new scope.Group();
    const ring = new scope.Path.Circle({ center: [nearest.x, nearest.y], radius: 7 });
    ring.strokeColor = new scope.Color(ACCENT);
    ring.strokeWidth = 2;
    const dot = new scope.Path.Circle({ center: [nearest.x, nearest.y], radius: 2.5 });
    dot.fillColor = new scope.Color(ACCENT);
    group.addChild(ring);
    group.addChild(dot);
    layer.addChild(group);
    drawSnap = group;
    drawSnap.bringToFront();
  }

  function resize(width: number, height: number): void {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    view.viewSize = new scope.Size(w, h);
    view.zoom = fitScale(w, h, VIEW_PADDING);
    view.center = new scope.Point(ARTBOARD_SIZE / 2, ARTBOARD_SIZE / 2);
  }

  function destroy(): void {
    project.clear();
    project.remove();
  }

  return {
    scope,
    project,
    view,
    setScene,
    getSilhouette,
    setLiveStroke,
    showPreviewRegion,
    setHover,
    updateDrawSnap,
    clearPreview,
    resize,
    destroy,
  };
}
