import { describe, expect, it } from 'vitest';
import { squareRect } from './artboard';
import { buildSilhouette, createHeadlessScope, type PaperPathItem } from './engine';
import { DEFAULT_FIT_OPTIONS, type CutOp, type Edge, type Pt } from './types';

const SQUARE = squareRect(); // x: 240, y: 240, 400 x 400
const SQUARE_AREA = SQUARE.width * SQUARE.height;

/** `area` lives on Path/CompoundPath but not the PathItem base type. */
function areaOf(shape: PaperPathItem): number {
  return (shape as unknown as { area: number }).area;
}

let counter = 0;
function op(rawPoints: Pt[], reflect: Edge | null): CutOp {
  counter += 1;
  return {
    id: `op-${counter}`,
    rawPoints,
    fit: { strategy: 'spline', options: DEFAULT_FIT_OPTIONS },
    reflect,
  };
}

function rect(x: number, y: number, width: number, height: number): Pt[] {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

describe('buildSilhouette', () => {
  it('returns the plain square for an empty log', () => {
    const scope = createHeadlessScope();
    const silhouette = buildSilhouette(scope, []);

    expect(areaOf(silhouette)).toBeCloseTo(SQUARE_AREA);
    expect(silhouette.bounds.x).toBeCloseTo(SQUARE.x);
    expect(silhouette.bounds.y).toBeCloseTo(SQUARE.y);
    expect(silhouette.bounds.width).toBeCloseTo(SQUARE.width);
    expect(silhouette.bounds.height).toBeCloseTo(SQUARE.height);
  });

  it('subtracts a cut from the square (hole only, no reflection)', () => {
    const scope = createHeadlessScope();
    const cut = rect(540, 400, 100, 80); // flush to the right edge
    const silhouette = buildSilhouette(scope, [op(cut, null)]);

    expect(areaOf(silhouette)).toBeCloseTo(SQUARE_AREA - 8000);
    expect(silhouette.bounds.x).toBeCloseTo(SQUARE.x);
    expect(silhouette.bounds.width).toBeCloseTo(SQUARE.width);
    // The hole is empty; the rest of the square is still filled.
    expect(silhouette.contains(new scope.Point(590, 440))).toBe(false);
    expect(silhouette.contains(new scope.Point(300, 300))).toBe(true);
  });

  it('subtracts the cut and unions the mirrored copy', () => {
    const scope = createHeadlessScope();
    const cut = rect(540, 400, 100, 80); // flush to the right edge
    const silhouette = buildSilhouette(scope, [op(cut, 'right')]);

    // Hole and copy are congruent, so total area matches the square.
    expect(areaOf(silhouette)).toBeCloseTo(SQUARE_AREA);
    // The copy extends one cut-width beyond the right edge.
    expect(silhouette.bounds.width).toBeCloseTo(SQUARE.width + 100);
    // Notch is empty; the reflected tab is filled.
    expect(silhouette.contains(new scope.Point(590, 440))).toBe(false);
    expect(silhouette.contains(new scope.Point(690, 440))).toBe(true);
    expect(silhouette.contains(new scope.Point(300, 300))).toBe(true);
  });

  it('reflects across each edge in the correct direction', () => {
    const cases: Array<{ edge: Edge; cut: Pt[]; check: (b: typeof SQUARE) => void }> = [
      { edge: 'left', cut: rect(240, 400, 100, 80), check: (b) => expect(b.x).toBeCloseTo(140) },
      { edge: 'right', cut: rect(540, 400, 100, 80), check: (b) => expect(b.x + b.width).toBeCloseTo(740) },
      { edge: 'top', cut: rect(400, 240, 80, 100), check: (b) => expect(b.y).toBeCloseTo(140) },
      { edge: 'bottom', cut: rect(400, 540, 80, 100), check: (b) => expect(b.y + b.height).toBeCloseTo(740) },
    ];

    for (const { edge, cut, check } of cases) {
      const scope = createHeadlessScope();
      const silhouette = buildSilhouette(scope, [op(cut, edge)]);
      expect(areaOf(silhouette)).toBeCloseTo(SQUARE_AREA);
      check(silhouette.bounds);
    }
  });

  it('is deterministic for a given log', () => {
    const ops = [op(rect(540, 400, 100, 80), 'right'), op(rect(400, 540, 80, 100), 'bottom')];
    const a = buildSilhouette(createHeadlessScope(), ops);
    const b = buildSilhouette(createHeadlessScope(), ops);

    expect(areaOf(a)).toBeCloseTo(areaOf(b));
    expect(a.bounds.x).toBeCloseTo(b.bounds.x);
    expect(a.bounds.y).toBeCloseTo(b.bounds.y);
    expect(a.bounds.width).toBeCloseTo(b.bounds.width);
    expect(a.bounds.height).toBeCloseTo(b.bounds.height);
  });

  it('does not insert items into the scene', () => {
    const scope = createHeadlessScope();
    buildSilhouette(scope, [op(rect(540, 400, 100, 80), 'right')]);
    expect(scope.project.activeLayer.children.length).toBe(0);
  });
});
