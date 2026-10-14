import type { Pt } from '../types';

/**
 * Keep the first point, any later point at least `minDistance` from the last
 * kept point, and always the final point. Used to thin live capture and inside
 * fitters so the stroke's endpoints are preserved.
 */
export function decimate(points: readonly Pt[], minDistance: number): Pt[] {
  if (points.length === 0) return [];
  const result: Pt[] = [points[0]];
  for (const point of points) {
    const last = result[result.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) >= minDistance) {
      result.push(point);
    }
  }
  const final = points[points.length - 1];
  const last = result[result.length - 1];
  if (final.x !== last.x || final.y !== last.y) {
    result.push(final);
  }
  return result;
}
