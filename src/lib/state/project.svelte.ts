import type { CutOp } from '../geometry/types';
import * as history from './history';

/**
 * App-facing project state: a runes store wrapping the pure snapshot history.
 * `$state.raw` avoids deep-proxying the geometry; the whole History is replaced
 * on every change.
 */
let state = $state.raw<history.History>(history.createHistory());

/** Read the current operation log (reactive when read in a reactive context). */
export function getOps(): readonly CutOp[] {
  return history.currentOps(state);
}

export function canUndo(): boolean {
  return history.canUndo(state);
}

export function canRedo(): boolean {
  return history.canRedo(state);
}

/** Append a committed cut. */
export function addCut(op: CutOp): void {
  state = history.push(state, op);
}

export function undo(): void {
  state = history.undo(state);
}

export function redo(): void {
  state = history.redo(state);
}

/** Clear the project (used by "New project" later). */
export function resetProject(): void {
  state = history.createHistory();
}
