/** The four edges of the original square, used as reflection axes. */
export type Edge = 'left' | 'right' | 'top' | 'bottom';

/** A point in logical artboard units. */
export interface Pt {
  x: number;
  y: number;
}

/** Parameters for the capture/fit stage (see ADR 0011). */
export interface FitOptions {
  /** Minimum gap between recorded raw points. */
  minDistance: number;
  /** Vertex reduction tolerance before fitting. */
  simplifyTolerance: number;
  /** Spline smoothing amount. */
  smoothing: number;
}

/** Registered stroke-fitting strategies. More may be added later. */
export type FitStrategyId = 'spline';

/**
 * A single cut operation. `rawPoints` is the canonical freehand input; the cut
 * region is derived from it (fitting + closure) at build time.
 */
export interface CutOp {
  id: string;
  rawPoints: Pt[];
  fit: { strategy: FitStrategyId; options: FitOptions };
  /** Edge to mirror across, or `null` for a hole with no reflection. */
  reflect: Edge | null;
}

export const DEFAULT_FIT_OPTIONS: FitOptions = {
  minDistance: 3,
  simplifyTolerance: 2,
  smoothing: 0.5,
};
