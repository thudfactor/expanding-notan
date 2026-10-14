import { describe, expect, it } from 'vitest';
import type { Pt } from '../types';
import { decimate, getFitter, listFitters, simplifyPoints, smoothPoints } from './index';

describe('decimate', () => {
  it('keeps the first and last point and respects minDistance in between', () => {
    const points: Pt[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1.5, y: 0 },
      { x: 5, y: 0 },
      { x: 5.5, y: 0 },
    ];
    expect(decimate(points, 3)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5.5, y: 0 },
    ]);
  });

  it('returns an empty array for no input', () => {
    expect(decimate([], 3)).toEqual([]);
  });
});

describe('simplifyPoints', () => {
  it('drops points that lie on a straight line', () => {
    const line: Pt[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ];
    expect(simplifyPoints(line, 0.1)).toEqual([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
    ]);
  });

  it('keeps points whose deviation exceeds the tolerance', () => {
    const spike: Pt[] = [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 0 },
    ];
    expect(simplifyPoints(spike, 1)).toEqual(spike);
  });

  it('always keeps the endpoints', () => {
    const points: Pt[] = [
      { x: 0, y: 0 },
      { x: 5, y: 1 },
      { x: 10, y: 0 },
    ];
    const out = simplifyPoints(points, 5);
    expect(out[0]).toEqual(points[0]);
    expect(out[out.length - 1]).toEqual(points[points.length - 1]);
  });
});

describe('smoothPoints', () => {
  it('preserves endpoints and pulls a spike toward its neighbours midpoint', () => {
    const spike: Pt[] = [
      { x: 0, y: 0 },
      { x: 5, y: 10 },
      { x: 10, y: 0 },
    ];
    expect(smoothPoints(spike, 1)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
    ]);
  });

  it('is a no-op when amount is 0', () => {
    const points: Pt[] = [
      { x: 0, y: 0 },
      { x: 5, y: 10 },
      { x: 10, y: 0 },
    ];
    expect(smoothPoints(points, 0)).toEqual(points);
  });
});

describe('fitter registry', () => {
  it('registers the spline fitter', () => {
    expect(getFitter('spline').id).toBe('spline');
    expect(listFitters().map((fitter) => fitter.id)).toContain('spline');
  });

  it('throws for an unknown fitter', () => {
    expect(() => getFitter('does-not-exist')).toThrow(/Unknown stroke fitter/);
  });

  it('fits end to end, preserving endpoints and thinning the point count', () => {
    const raw: Pt[] = [];
    for (let i = 0; i <= 20; i++) raw.push({ x: i, y: 0 });

    const fitter = getFitter('spline');
    const fitted = fitter.fit(raw, fitter.defaults);

    expect(fitted[0]).toEqual({ x: 0, y: 0 });
    expect(fitted[fitted.length - 1]).toEqual({ x: 20, y: 0 });
    expect(fitted.length).toBeLessThan(raw.length);
  });
});
