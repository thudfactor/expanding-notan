import type { CutOp } from '../geometry/types';

/**
 * The single work-in-progress operation log. `$state.raw` avoids deep-proxying
 * the geometry arrays; the log is replaced wholesale when it changes.
 *
 * History and persistence are layered on top of this in later milestones.
 */
let ops = $state.raw<CutOp[]>([]);

/** Read the current operation log (reactive when read in a reactive context). */
export function getOps(): readonly CutOp[] {
  return ops;
}

/** Append a committed cut. */
export function addCut(op: CutOp): void {
  ops = [...ops, op];
}

/** Clear the project (used by "New project" later). */
export function resetProject(): void {
  ops = [];
}
