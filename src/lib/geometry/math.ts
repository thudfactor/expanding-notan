import type { Rect } from './artboard';
import type { Edge, Pt } from './types';

/**
 * The coordinate of the square edge used as the reflection axis.
 * Left/top are the low coordinates; right/bottom are the high ones.
 */
export function edgeAxis(edge: Edge, square: Rect): number {
  switch (edge) {
    case 'left':
      return square.x;
    case 'right':
      return square.x + square.width;
    case 'top':
      return square.y;
    case 'bottom':
      return square.y + square.height;
  }
}

/** True when the edge is a vertical line (left/right). */
export function isVerticalEdge(edge: Edge): boolean {
  return edge === 'left' || edge === 'right';
}

/** The two endpoints of a square edge (used to draw an edge highlight). */
export function edgeSegment(edge: Edge, square: Rect): [Pt, Pt] {
  switch (edge) {
    case 'left':
      return [
        { x: square.x, y: square.y },
        { x: square.x, y: square.y + square.height },
      ];
    case 'right':
      return [
        { x: square.x + square.width, y: square.y },
        { x: square.x + square.width, y: square.y + square.height },
      ];
    case 'top':
      return [
        { x: square.x, y: square.y },
        { x: square.x + square.width, y: square.y },
      ];
    case 'bottom':
      return [
        { x: square.x, y: square.y + square.height },
        { x: square.x + square.width, y: square.y + square.height },
      ];
  }
}

/**
 * Mirror points across a square edge. The perpendicular component is negated
 * about the axis; the parallel component is unchanged.
 */
export function mirrorPoints(points: readonly Pt[], edge: Edge, square: Rect): Pt[] {
  const axis = edgeAxis(edge, square);
  return isVerticalEdge(edge)
    ? points.map((p) => ({ x: 2 * axis - p.x, y: p.y }))
    : points.map((p) => ({ x: p.x, y: 2 * axis - p.y }));
}

/** Twice the signed area (shoelace). Sign indicates winding orientation. */
export function signedArea2(points: readonly Pt[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum;
}

/** Unsigned area of a simple polygon. */
export function polygonArea(points: readonly Pt[]): number {
  return Math.abs(signedArea2(points)) / 2;
}

/**
 * Whether a polygon's bounding box intersects the artboard `[0, size] × [0, size]`.
 * Used to disable reflections that would place a cut entirely off the artboard.
 */
export function intersectsArtboard(points: readonly Pt[], size: number): boolean {
  if (points.length === 0) return false;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  return maxX >= 0 && minX <= size && maxY >= 0 && minY <= size;
}
