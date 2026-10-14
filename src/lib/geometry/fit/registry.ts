import type { FitOptions, Pt } from '../types';

/**
 * A replaceable stroke-fitting strategy. Fitting is a pure transform from raw
 * captured points to fitted vertices; it never mutates its input and has no
 * Paper.js dependency. More strategies (polyline, curves, ...) can be
 * registered later without changing the pipeline.
 */
export interface StrokeFitter {
  /** Registry key stored on each cut op. */
  id: string;
  /** Human-readable name, for a future strategy picker. */
  label: string;
  /** Options applied to new strokes using this strategy. */
  defaults: FitOptions;
  /** Turn raw captured points into fitted vertices. */
  fit(points: readonly Pt[], options: FitOptions): Pt[];
}

const fitters = new Map<string, StrokeFitter>();

export function registerFitter(fitter: StrokeFitter): void {
  fitters.set(fitter.id, fitter);
}

export function getFitter(id: string): StrokeFitter {
  const fitter = fitters.get(id);
  if (!fitter) throw new Error(`Unknown stroke fitter: ${id}`);
  return fitter;
}

export function listFitters(): StrokeFitter[] {
  return [...fitters.values()];
}
