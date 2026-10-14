import { describe, expect, it } from 'vitest';
import { squareRect, type Rect } from './artboard';
import { edgeAxis, isVerticalEdge, mirrorPoints, polygonArea, signedArea2 } from './math';
import type { Edge, Pt } from './types';

const SQUARE: Rect = squareRect(); // x: 240, y: 240, 400 x 400

describe('edgeAxis', () => {
  it('returns the square edge coordinates', () => {
    expect(edgeAxis('left', SQUARE)).toBe(240);
    expect(edgeAxis('right', SQUARE)).toBe(640);
    expect(edgeAxis('top', SQUARE)).toBe(240);
    expect(edgeAxis('bottom', SQUARE)).toBe(640);
  });

  it('classifies vertical edges', () => {
    expect(isVerticalEdge('left')).toBe(true);
    expect(isVerticalEdge('right')).toBe(true);
    expect(isVerticalEdge('top')).toBe(false);
    expect(isVerticalEdge('bottom')).toBe(false);
  });
});

describe('mirrorPoints', () => {
  const point: Pt[] = [{ x: 300, y: 400 }];

  it('mirrors across each edge by negating the perpendicular component', () => {
    expect(mirrorPoints(point, 'right', SQUARE)).toEqual([{ x: 980, y: 400 }]);
    expect(mirrorPoints(point, 'left', SQUARE)).toEqual([{ x: 180, y: 400 }]);
    expect(mirrorPoints(point, 'top', SQUARE)).toEqual([{ x: 300, y: 80 }]);
    expect(mirrorPoints(point, 'bottom', SQUARE)).toEqual([{ x: 300, y: 880 }]);
  });

  it('is an involution: mirroring twice returns the original points', () => {
    const edges: Edge[] = ['left', 'right', 'top', 'bottom'];
    const polygon: Pt[] = [
      { x: 300, y: 350 },
      { x: 420, y: 360 },
      { x: 400, y: 500 },
    ];
    for (const edge of edges) {
      expect(mirrorPoints(mirrorPoints(polygon, edge, SQUARE), edge, SQUARE)).toEqual(polygon);
    }
  });

  it('preserves area', () => {
    const polygon: Pt[] = [
      { x: 300, y: 350 },
      { x: 420, y: 360 },
      { x: 400, y: 500 },
    ];
    const area = polygonArea(polygon);
    for (const edge of ['left', 'right', 'top', 'bottom'] as Edge[]) {
      expect(polygonArea(mirrorPoints(polygon, edge, SQUARE))).toBeCloseTo(area);
    }
  });
});

describe('area helpers', () => {
  it('computes polygon area', () => {
    const square: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(polygonArea(square)).toBe(100);
    expect(polygonArea([...square].reverse())).toBe(100);
  });

  it('reports orientation via the signed area', () => {
    const ccw: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(Math.sign(signedArea2(ccw))).toBe(-Math.sign(signedArea2([...ccw].reverse())));
  });
});
