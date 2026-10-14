import { describe, expect, it } from 'vitest';
import { squareRect } from './artboard';
import { buildSilhouette, createHeadlessScope } from './engine';
import { mirrorPoints, polygonArea } from './math';
import { closeRegion, closureOptionsFromScale } from './tracing';
import type { Pt } from './types';

const SQUARE = squareRect();

function spot() {
  const scope = createHeadlessScope();
  return { scope, silhouette: buildSilhouette(scope, []) };
}

describe('closeRegion', () => {
  it('closes a near-closed stroke on itself', () => {
    const { scope, silhouette } = spot();
    const blob: Pt[] = [
      { x: 400, y: 380 },
      { x: 470, y: 400 },
      { x: 470, y: 470 },
      { x: 400, y: 490 },
      { x: 400, y: 380 },
    ];
    const result = closeRegion(scope, blob, silhouette);

    expect(result?.kind).toBe('self');
    expect(result?.snapPoints).toEqual([]);
    expect(polygonArea(result!.region)).toBeCloseTo(polygonArea(blob.slice(0, -1)), 0);
  });

  it('snaps an edge-to-edge stroke and keeps the region inside the edge', () => {
    const { scope, silhouette } = spot();
    const stroke: Pt[] = [
      { x: 641, y: 380 }, // just outside the right edge; should snap to x = 640
      { x: 560, y: 420 },
      { x: 560, y: 470 },
      { x: 639, y: 500 },
    ];
    const result = closeRegion(scope, stroke, silhouette);

    expect(result?.kind).toBe('edge');
    expect(result?.snapPoints).toHaveLength(2);
    expect(result!.snapPoints[0].x).toBeCloseTo(640);
    expect(result!.snapPoints[1].x).toBeCloseTo(640);

    const maxX = Math.max(...result!.region.map((point) => point.x));
    expect(maxX).toBeCloseTo(640);
    expect(polygonArea(result!.region)).toBeGreaterThan(1000);
  });

  it("mirrors an edge-to-edge region across the edge into an attached tab", () => {
    const { scope, silhouette } = spot();
    const stroke: Pt[] = [
      { x: 640, y: 380 },
      { x: 560, y: 420 },
      { x: 560, y: 470 },
      { x: 640, y: 500 },
    ];
    const result = closeRegion(scope, stroke, silhouette)!;
    const mirrored = mirrorPoints(result.region, 'right', SQUARE);

    // The mirrored copy starts exactly at the edge, so it stays attached.
    expect(Math.min(...mirrored.map((point) => point.x))).toBeCloseTo(640);
  });

  it('rejects an open stroke whose endpoints are far from any edge', () => {
    const { scope, silhouette } = spot();
    const stroke: Pt[] = [
      { x: 380, y: 360 },
      { x: 420, y: 400 },
      { x: 400, y: 440 },
    ];
    expect(closeRegion(scope, stroke, silhouette)).toBeNull();
  });

  it('rejects a chord that cuts across the interior instead of an edge', () => {
    const { scope, silhouette } = spot();
    const stroke: Pt[] = [
      { x: 400, y: 240 }, // top edge
      { x: 300, y: 300 },
      { x: 240, y: 400 }, // left edge
    ];
    expect(closeRegion(scope, stroke, silhouette)).toBeNull();
  });

  it('rejects a region smaller than the minimum area', () => {
    const { scope, silhouette } = spot();
    const tiny: Pt[] = [
      { x: 400, y: 400 },
      { x: 402, y: 400 },
      { x: 402, y: 402 },
      { x: 400, y: 402 },
      { x: 400, y: 400 },
    ];
    expect(closeRegion(scope, tiny, silhouette)).toBeNull();
  });

  it('accepts a stroke that overshoots the edge, using the crossings as endpoints', () => {
    const { scope, silhouette } = spot();
    // Both endpoints sit 50 units past the right edge (x = 640) — well beyond the
    // default 20-unit snap radius, so this only works via boundary crossings.
    const stroke: Pt[] = [
      { x: 690, y: 360 },
      { x: 560, y: 430 },
      { x: 560, y: 470 },
      { x: 690, y: 520 },
    ];
    const result = closeRegion(scope, stroke, silhouette);

    expect(result?.kind).toBe('edge');
    expect(result!.snapPoints[0].x).toBeCloseTo(640);
    expect(result!.snapPoints[1].x).toBeCloseTo(640);
    expect(Math.max(...result!.region.map((point) => point.x))).toBeCloseTo(640);
    expect(polygonArea(result!.region)).toBeGreaterThan(1000);
  });
});

describe('closureOptionsFromScale', () => {
  it('converts pixel radii into artboard units', () => {
    const options = closureOptionsFromScale(1.5, { closeRadiusPx: 20, snapRadiusPx: 30 });
    expect(options.closeThreshold).toBeCloseTo(30);
    expect(options.snapThreshold).toBeCloseTo(45);
  });
});
