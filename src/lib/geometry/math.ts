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
