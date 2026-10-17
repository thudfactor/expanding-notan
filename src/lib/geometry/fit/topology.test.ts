import { describe, expect, it } from 'vitest';
import { strokeCrossesItself } from '../tracing';
import type { Pt } from '../types';
import { fitPreservingTopology, getFitter } from './index';

const fitter = getFitter('spline');
const crosses = (points: readonly Pt[]): boolean => strokeCrossesItself(points);

/**
 * A stroke that is simple as drawn but which the default fit (RDP + smoothing)
 * folds into a self-crossing. Captured from a stress probe of the fitter.
 */
const FOLDING_STROKE: Pt[] = [
  { x: 351.57461876605544, y: 276.3075375404565 },
  { x: 347.59724371590033, y: 269.2531043713268 },
  { x: 350.26714801706584, y: 259.97866244725776 },
  { x: 376.30269556876306, y: 255.48241172420921 },
  { x: 380.85304535536926, y: 253.793491405978 },
  { x: 383.6407721083361, y: 256.2790708382814 },
  { x: 386.57525018214164, y: 256.5702247343599 },
  { x: 399.2635908699368, y: 240.12990748127967 },
  { x: 396.8448074462725, y: 229.4744027374928 },
  { x: 394.35049874663, y: 229.42031134884158 },
  { x: 384.381692591496, y: 228.69477629821856 },
  { x: 391.5574800529744, y: 247.6807401882106 },
];

describe('fitPreservingTopology', () => {
  it('falls back to a simpler fit when the default fit introduces a crossing', () => {
    // Premise: the raw stroke is simple, the default fit is not.
    expect(crosses(FOLDING_STROKE)).toBe(false);
    expect(crosses(fitter.fit(FOLDING_STROKE, fitter.defaults))).toBe(true);

    const result = fitPreservingTopology(FOLDING_STROKE, fitter, fitter.defaults, crosses);

    expect(crosses(result.points)).toBe(false);
    // The effective options are recorded and differ from the requested ones.
    expect(result.options).not.toEqual(fitter.defaults);
  });

  it('keeps the requested fit when it is already simple', () => {
    const raw: Pt[] = [
      { x: 300, y: 300 },
      { x: 400, y: 320 },
      { x: 500, y: 300 },
      { x: 600, y: 340 },
    ];
    const result = fitPreservingTopology(raw, fitter, fitter.defaults, crosses);

    expect(crosses(result.points)).toBe(false);
    expect(result.options).toEqual(fitter.defaults);
  });
});
