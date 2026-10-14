import type { Pt } from '../types';

/**
 * Blend each interior point toward the midpoint of its neighbours. `amount` is
 * clamped to [0, 1]; endpoints are preserved so an open stroke stays anchored
 * at the points the user drew.
 */
export function smoothPoints(points: readonly Pt[], amount: number): Pt[] {
  const a = Math.max(0, Math.min(1, amount));
  if (a === 0 || points.length < 3) return points.slice();

  const result: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const previous = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    const midX = (previous.x + next.x) / 2;
    const midY = (previous.y + next.y) / 2;
    result.push({
      x: current.x + a * (midX - current.x),
      y: current.y + a * (midY - current.y),
    });
  }
  result.push(points[points.length - 1]);
  return result;
}
