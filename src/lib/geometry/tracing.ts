import { pathFromPoints, type PaperPathItem, type PaperScope } from './engine';
import type { Pt } from './types';

export interface ClosureOptions {
  /** Max start-to-end distance for treating a stroke as closed on itself. */
  closeThreshold: number;
  /** Max endpoint distance to the silhouette for snapping it to an edge. */
  snapThreshold: number;
  /** Minimum resolved region area; smaller cuts are rejected. */
  minArea: number;
  /** Max distance a boundary-chord sample may sit from the silhouette. */
  boundaryTolerance: number;
}

export const DEFAULT_CLOSURE: ClosureOptions = {
  closeThreshold: 14,
  snapThreshold: 20,
  minArea: 24,
  boundaryTolerance: 1.5,
};

/** Grab radii in CSS pixels, converted to artboard units via the view scale. */
export interface ClosureRadiiPx {
  closeRadiusPx: number;
  snapRadiusPx: number;
}

export const DEFAULT_CLOSURE_PX: ClosureRadiiPx = {
  closeRadiusPx: 24,
  snapRadiusPx: 32,
};

/**
 * Build closure thresholds from pixel radii so the "grab" feel is constant
 * across window sizes. `unitsPerPx` is artboard units per CSS pixel (1 / view.zoom).
 */
export function closureOptionsFromScale(
  unitsPerPx: number,
  radii: ClosureRadiiPx = DEFAULT_CLOSURE_PX,
): ClosureOptions {
  return {
    closeThreshold: radii.closeRadiusPx * unitsPerPx,
    snapThreshold: radii.snapRadiusPx * unitsPerPx,
    minArea: DEFAULT_CLOSURE.minArea,
    boundaryTolerance: DEFAULT_CLOSURE.boundaryTolerance,
  };
}

export type ClosureKind = 'self' | 'edge';

export interface ClosureResult {
  kind: ClosureKind;
  /** Resolved, black-clipped cut region in artboard units. */
  region: Pt[];
  /** Where the stroke was snapped to the silhouette (empty for 'self'). */
  snapPoints: Pt[];
}

function distance(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function dedupe(points: readonly Pt[]): Pt[] {
  const result: Pt[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y) result.push({ x: point.x, y: point.y });
  }
  return result;
}

function areaOf(item: PaperPathItem): number {
  return (item as unknown as { area: number }).area;
}

function pathToPoints(item: PaperPathItem): Pt[] {
  const children = (item as unknown as { children?: PaperPathItem[] }).children;
  if (children && children.length > 0) {
    let best = children[0];
    for (const child of children) {
      if (areaOf(child) > areaOf(best)) best = child;
    }
    return pathToPoints(best);
  }
  const segments = (item as unknown as { segments?: Array<{ point: { x: number; y: number } }> })
    .segments;
  return (segments ?? []).map((segment) => ({ x: segment.point.x, y: segment.point.y }));
}

function nearestOnPath(
  scope: PaperScope,
  path: PaperPathItem,
  point: Pt,
): { point: Pt; distance: number } {
  const target = new scope.Point(point.x, point.y);
  const nearest = path.getNearestPoint(target);
  return {
    point: { x: nearest.x, y: nearest.y },
    distance: target.getDistance(nearest),
  };
}

/** Does the straight chord from a to b stay on the silhouette boundary? */
function chordFollowsBoundary(
  scope: PaperScope,
  silhouette: PaperPathItem,
  a: Pt,
  b: Pt,
  tolerance: number,
): boolean {
  const samples = 16;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (nearestOnPath(scope, silhouette, point).distance > tolerance) return false;
  }
  return true;
}

/** Clip a closed polygon to the black silhouette; null if too small. */
function clipToSilhouette(
  scope: PaperScope,
  polygon: readonly Pt[],
  silhouette: PaperPathItem,
  options: ClosureOptions,
): Pt[] | null {
  if (polygon.length < 3) return null;
  const clipped = pathFromPoints(scope, polygon).intersect(silhouette);
  if (!clipped || areaOf(clipped) < options.minArea) return null;
  const region = pathToPoints(clipped);
  return region.length >= 3 ? region : null;
}

function cumulativeOffsets(points: readonly Pt[]): number[] {
  const offsets = [0];
  for (let i = 1; i < points.length; i++) {
    offsets.push(offsets[i - 1] + distance(points[i - 1], points[i]));
  }
  return offsets;
}

function pointAtOffset(points: readonly Pt[], offsets: readonly number[], target: number): Pt {
  const last = points.length - 1;
  if (target <= 0) return { ...points[0] };
  if (target >= offsets[last]) return { ...points[last] };
  for (let i = 0; i < last; i++) {
    if (target <= offsets[i + 1]) {
      const span = offsets[i + 1] - offsets[i];
      const f = span === 0 ? 0 : (target - offsets[i]) / span;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
      };
    }
  }
  return { ...points[last] };
}

function trimPolyline(
  points: readonly Pt[],
  offsets: readonly number[],
  from: number,
  to: number,
): Pt[] {
  const trimmed: Pt[] = [pointAtOffset(points, offsets, from)];
  for (let i = 0; i < points.length; i++) {
    if (offsets[i] > from && offsets[i] < to) trimmed.push({ ...points[i] });
  }
  trimmed.push(pointAtOffset(points, offsets, to));
  return trimmed;
}

interface Endpoints {
  start: Pt;
  end: Pt;
  /** Interior stroke points between the endpoints. */
  middle: Pt[];
}

/**
 * Prefer the points where the stroke crosses the silhouette boundary as the cut
 * endpoints (handles overshoot); otherwise fall back to snapping the endpoints
 * to the nearest boundary point within the snap radius.
 */
function resolveEndpoints(
  scope: PaperScope,
  points: readonly Pt[],
  silhouette: PaperPathItem,
  options: ClosureOptions,
): Endpoints | null {
  const stroke = new scope.Path(points.map((point) => [point.x, point.y]));
  const crossings = stroke.getIntersections(silhouette).sort((a, b) => a.offset - b.offset);

  if (crossings.length >= 2) {
    const from = crossings[0].offset;
    const to = crossings[crossings.length - 1].offset;
    if (to > from) {
      const trimmed = trimPolyline(points, cumulativeOffsets(points), from, to);
      if (trimmed.length >= 3) {
        return {
          start: trimmed[0],
          end: trimmed[trimmed.length - 1],
          middle: trimmed.slice(1, -1),
        };
      }
    }
  }

  const start = nearestOnPath(scope, silhouette, points[0]);
  const end = nearestOnPath(scope, silhouette, points[points.length - 1]);
  if (start.distance > options.snapThreshold || end.distance > options.snapThreshold) return null;

  return { start: start.point, end: end.point, middle: points.slice(1, -1) };
}

/**
 * Turn a fitted stroke into a cut region, or null when the stroke is neither
 * closed on itself nor a valid edge-to-edge cut.
 *
 * - Near-closed strokes become a region directly.
 * - Otherwise the endpoints come from where the stroke crosses the silhouette
 *   (falling back to snapping nearby endpoints), the closing chord must follow
 *   the boundary, and the region is clipped to the current black silhouette.
 */
export function closeRegion(
  scope: PaperScope,
  fitted: readonly Pt[],
  silhouette: PaperPathItem,
  options: ClosureOptions = DEFAULT_CLOSURE,
): ClosureResult | null {
  const points = dedupe(fitted);
  if (points.length < 3) return null;

  if (distance(points[0], points[points.length - 1]) <= options.closeThreshold) {
    const region = clipToSilhouette(scope, points.slice(0, -1), silhouette, options);
    return region ? { kind: 'self', region, snapPoints: [] } : null;
  }

  const endpoints = resolveEndpoints(scope, points, silhouette, options);
  if (!endpoints) return null;

  const { start, end, middle } = endpoints;
  if (!chordFollowsBoundary(scope, silhouette, start, end, options.boundaryTolerance)) return null;

  const region = clipToSilhouette(scope, [start, ...middle, end], silhouette, options);
  return region ? { kind: 'edge', region, snapPoints: [start, end] } : null;
}
