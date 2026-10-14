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

/**
 * Turn a fitted stroke into a cut region, or return null when the stroke is
 * neither closed on itself nor a valid edge-to-edge cut.
 *
 * - Near-closed strokes become a region directly.
 * - Otherwise both endpoints must snap to a silhouette edge, and the straight
 *   chord between them must follow that boundary (so the region is bounded by
 *   the edge). Corner-spanning or interior chords are rejected.
 * - The resolved region is clipped to the current black silhouette: you can
 *   only cut what is black.
 */
export function closeRegion(
  scope: PaperScope,
  fitted: readonly Pt[],
  silhouette: PaperPathItem,
  options: ClosureOptions = DEFAULT_CLOSURE,
): ClosureResult | null {
  const points = dedupe(fitted);
  if (points.length < 3) return null;

  let closedPoints: Pt[];
  let snapPoints: Pt[] = [];
  let kind: ClosureKind;

  const isClosed = distance(points[0], points[points.length - 1]) <= options.closeThreshold;

  if (isClosed) {
    kind = 'self';
    closedPoints = points.slice(0, -1); // drop the duplicated endpoint
  } else {
    const start = nearestOnPath(scope, silhouette, points[0]);
    const end = nearestOnPath(scope, silhouette, points[points.length - 1]);
    if (start.distance > options.snapThreshold || end.distance > options.snapThreshold) {
      return null;
    }

    kind = 'edge';
    closedPoints = points.slice();
    closedPoints[0] = start.point;
    closedPoints[closedPoints.length - 1] = end.point;
    snapPoints = [start.point, end.point];

    if (
      !chordFollowsBoundary(scope, silhouette, start.point, end.point, options.boundaryTolerance)
    ) {
      return null;
    }
  }

  if (closedPoints.length < 3) return null;

  const clipped = pathFromPoints(scope, closedPoints).intersect(silhouette);
  if (!clipped || areaOf(clipped) < options.minArea) return null;

  const region = pathToPoints(clipped);
  if (region.length < 3) return null;

  return { kind, region, snapPoints };
}
