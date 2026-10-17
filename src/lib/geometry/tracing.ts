import { pathFromPoints, type PaperPathItem, type PaperScope } from './engine';
import { polygonArea } from './math';
import type { Pt } from './types';

export interface ClosureOptions {
  /** Max start-to-end distance for treating a stroke as closed on itself. */
  closeThreshold: number;
  /** Max endpoint distance to the silhouette for snapping it to an edge. */
  snapThreshold: number;
  /** Minimum resolved region area; smaller cuts are rejected. */
  minArea: number;
  /** Max distance a boundary endpoint may sit from the silhouette. */
  boundaryTolerance: number;
}

export const DEFAULT_CLOSURE: ClosureOptions = {
  closeThreshold: 14,
  snapThreshold: 20,
  minArea: 24,
  boundaryTolerance: 1.5,
};

/** Spacing (artboard units) between samples along a boundary arc. */
const ARC_STEP = 2;

/**
 * When a cut divides the silhouette into two pieces whose areas are this
 * similar (smaller / larger), the choice of which piece is "the cut" is
 * ambiguous and both are offered. Otherwise only the smaller piece is returned.
 */
const PIECE_AMBIGUITY_RATIO = 0.5;

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

/** A resolved, black-clipped region plus its area (for default selection). */
export interface RegionCandidate {
  region: Pt[];
  area: number;
}

export interface SelfClosure {
  kind: 'self';
  /** Resolved, black-clipped cut region in artboard units. */
  region: Pt[];
  snapPoints: [];
}

export interface EdgeClosure {
  kind: 'edge';
  /** Where the stroke met the silhouette, in order. */
  snapPoints: [Pt, Pt];
  /**
   * The sub-region(s) the stroke partitions the silhouette into, smallest
   * first. Usually one (the smaller piece); two when the split is near-even.
   */
  candidates: RegionCandidate[];
}

export type ClosureResult = SelfClosure | EdgeClosure;

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
  return Math.abs((item as unknown as { area: number }).area);
}

function childrenOf(item: PaperPathItem): PaperPathItem[] {
  const children = (item as unknown as { children?: PaperPathItem[] }).children;
  return children && children.length > 0 ? children : [item];
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

// --- Simplicity (a stroke may not cross itself) ---------------------------

/** Strict proper-crossing test between segments ab and cd. */
function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const orient = (p: Pt, q: Pt, r: Pt): number =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = orient(a, b, c);
  const d2 = orient(a, b, d);
  const d3 = orient(c, d, a);
  const d4 = orient(c, d, b);
  return (d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0);
}

/**
 * A polyline is simple when no two non-adjacent segments cross. `closed` treats
 * the first and last segments as adjacent (wrapping).
 */
function isSimple(points: readonly Pt[], closed: boolean): boolean {
  const n = points.length;
  if (n < 3) return false;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    for (let j = i + 1; j < segments; j++) {
      if (j === i + 1) continue; // shares an endpoint
      if (closed && i === 0 && j === segments - 1) continue; // wrap adjacency
      const c = points[j];
      const d = points[(j + 1) % n];
      if (segmentsCross(a, b, c, d)) return false;
    }
  }
  return true;
}

/**
 * True when a freehand stroke crosses itself. Scissors cannot cross their own
 * just-cut line, so such strokes are not valid cuts (ADR 0014). Crossing an
 * *earlier* cut is fine and is not detected here. A near-closed stroke is
 * treated as a loop, so its first and last segments count as adjacent.
 */
export function strokeCrossesItself(
  points: readonly Pt[],
  options: ClosureOptions = DEFAULT_CLOSURE,
): boolean {
  const deduped = dedupe(points);
  if (deduped.length < 3) return false;
  const closed = distance(deduped[0], deduped[deduped.length - 1]) <= options.closeThreshold;
  return closed ? !isSimple(deduped.slice(0, -1), true) : !isSimple(deduped, false);
}

// --- Region resolution ----------------------------------------------------

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

/**
 * Resolve a candidate region. A candidate is rejected when it carries a hole
 * (an enclosed existing hole cannot be represented by the single-polygon
 * `region`), or when it is smaller than `minArea`.
 */
function resolveCandidate(
  scope: PaperScope,
  polygon: readonly Pt[],
  silhouette: PaperPathItem,
  options: ClosureOptions,
): RegionCandidate | null {
  if (polygon.length < 3) return null;
  const clipped = pathFromPoints(scope, polygon).intersect(silhouette);
  if (!clipped) return null;

  const areas = childrenOf(clipped).map(areaOf).sort((a, b) => b - a);
  if (areas.length > 1 && areas[1] >= options.minArea) return null; // has a hole
  if (areas[0] < options.minArea) return null;

  const region = pathToPoints(clipped);
  return region.length >= 3 ? { region, area: polygonArea(region) } : null;
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

// --- Boundary arcs --------------------------------------------------------

/** The individual closed boundary contours of the silhouette. */
function boundaryPaths(silhouette: PaperPathItem): PaperPathItem[] {
  return childrenOf(silhouette);
}

function offsetOnPath(scope: PaperScope, path: PaperPathItem, point: Pt): number {
  const target = path as unknown as { getOffsetOf(p: unknown): number };
  return target.getOffsetOf(new scope.Point(point.x, point.y));
}

/** Sample a path between two offsets, walking forward (wrapping if needed). */
function sampleArc(path: PaperPathItem, fromOffset: number, toOffset: number): Pt[] {
  const target = path as unknown as {
    length: number;
    getPointAt(offset: number): { x: number; y: number };
  };
  const total = target.length;
  if (!(total > 0)) return [];

  let span = toOffset - fromOffset;
  if (span < 0) span += total;
  const count = Math.max(1, Math.ceil(span / ARC_STEP));

  const points: Pt[] = [];
  for (let i = 0; i <= count; i++) {
    const offset = (fromOffset + (span * i) / count) % total;
    const point = target.getPointAt(offset);
    points.push({ x: point.x, y: point.y });
  }
  return points;
}

/**
 * The two boundary runs from `end` back to `start`, along the same contour:
 * one going each way around the loop. Returns null when the endpoints are not
 * on the same contour (outer vs a hole) — that cut is a slit, not a piece.
 */
function boundaryArcs(
  scope: PaperScope,
  silhouette: PaperPathItem,
  start: Pt,
  end: Pt,
  options: ClosureOptions,
): [Pt[], Pt[]] | null {
  for (const path of boundaryPaths(silhouette)) {
    const a = nearestOnPath(scope, path, start);
    const b = nearestOnPath(scope, path, end);
    if (a.distance > options.boundaryTolerance || b.distance > options.boundaryTolerance) continue;

    const from = offsetOnPath(scope, path, a.point);
    const to = offsetOnPath(scope, path, b.point);
    const forward = sampleArc(path, to, from); // end -> start
    const backward = sampleArc(path, from, to).reverse(); // end -> start, other way
    return [forward, backward];
  }
  return null;
}

/**
 * Turn a fitted stroke into a cut region, or null when the stroke is neither
 * closed on itself nor a valid edge-to-edge cut.
 *
 * - A stroke that crosses itself is rejected (ADR 0014).
 * - Near-closed strokes become a region directly.
 * - Otherwise the endpoints come from where the stroke crosses the silhouette
 *   (falling back to snapping nearby endpoints), and the region is the area
 *   enclosed by the stroke plus the boundary arc between the endpoints.
 * - A boundary-to-boundary cut may partition the silhouette into two pieces;
 *   both are returned when their areas are comparable (smallest first).
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
    const loop = points.slice(0, -1);
    if (!isSimple(loop, true)) return null;
    const region = clipToSilhouette(scope, loop, silhouette, options);
    return region ? { kind: 'self', region, snapPoints: [] } : null;
  }

  if (!isSimple(points, false)) return null;

  const endpoints = resolveEndpoints(scope, points, silhouette, options);
  if (!endpoints) return null;

  const { start, end, middle } = endpoints;
  const arcs = boundaryArcs(scope, silhouette, start, end, options);
  if (!arcs) return null;

  const candidates: RegionCandidate[] = [];
  for (const arc of arcs) {
    const polygon = dedupe([start, ...middle, end, ...arc.slice(1, -1)]);
    if (!isSimple(polygon, true)) continue;
    const candidate = resolveCandidate(scope, polygon, silhouette, options);
    if (candidate) candidates.push(candidate);
  }
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.area - b.area);
  const [small, large] = candidates;
  const resolved =
    large && small.area / large.area >= PIECE_AMBIGUITY_RATIO ? [small, large] : [small];

  return { kind: 'edge', snapPoints: [start, end], candidates: resolved };
}
