import type { FitOptions, Pt } from '../types';
import type { StrokeFitter } from './registry';

/** A fitted stroke together with the options that actually produced it. */
export interface TopologyFit {
  points: Pt[];
  options: FitOptions;
}

/**
 * The option rungs tried, from the requested fit to the raw stroke. Each step
 * is *less* aggressive, so it moves closer to the original drawing: drop
 * smoothing (the folding stage), then simplification, then decimation, and
 * finally the raw stroke itself (all tolerances zero).
 */
function ladder(options: FitOptions): FitOptions[] {
  return [
    options,
    { ...options, smoothing: 0 },
    { ...options, smoothing: 0, simplifyTolerance: 0 },
    { ...options, smoothing: 0, simplifyTolerance: 0, minDistance: 0 },
  ];
}

/**
 * Fit `raw`, guaranteeing the fit does not introduce a self-intersection the
 * raw stroke did not have (ADR 0014, option E).
 *
 * The requested fit is tried first. If it crosses itself, progressively less
 * aggressive options are tried until the fit is simple or the raw stroke is
 * reached. Because the final rung is (a thinning-free fit of) the raw stroke, a
 * simple raw stroke always yields a simple fit; if nothing is simple then the
 * raw stroke crossed itself and the caller rejects it.
 *
 * `crosses` is injected so this module stays free of the closure/Paper layer.
 * The returned `options` are the ones that actually produced `points`, so the
 * op can record what was used (ADR 0011).
 */
export function fitPreservingTopology(
  raw: readonly Pt[],
  fitter: StrokeFitter,
  options: FitOptions,
  crosses: (points: readonly Pt[]) => boolean,
): TopologyFit {
  let fallback: TopologyFit | undefined;
  for (const candidate of ladder(options)) {
    const result: TopologyFit = { points: fitter.fit(raw, candidate), options: candidate };
    fallback ??= result;
    if (!crosses(result.points)) return result;
  }
  // Nothing was simple: the raw stroke itself crosses. Return the requested fit
  // so the caller reports the failure against what the user asked for.
  return fallback as TopologyFit;
}
