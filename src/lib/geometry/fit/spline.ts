import type { Pt } from '../types';
import { decimate } from './decimate';
import type { StrokeFitter } from './registry';
import { simplifyPoints } from './simplify';
import { smoothPoints } from './smooth';

/**
 * The MVP fitting strategy: thin the captured points, simplify with RDP, then
 * smooth. Returns a polyline that approximates the drawn curve. A future
 * strategy could emit true curve segments instead.
 */
export const splineFitter: StrokeFitter = {
  id: 'spline',
  label: 'Spline',
  defaults: { minDistance: 3, simplifyTolerance: 2, smoothing: 0.5 },
  fit(points, options) {
    const sampled = decimate(points, options.minDistance);
    const simplified = simplifyPoints(sampled, options.simplifyTolerance);
    return smoothPoints(simplified, options.smoothing);
  },
};
