import type { CutOp } from '../geometry/types';

/**
 * Immutable, snapshot-based history over the operation log. Each state is a
 * complete `CutOp[]`; undo/redo move a cursor. Snapshots share the unchanged
 * `CutOp` objects, so only the array is copied.
 *
 * Pure and framework-free so it can be unit-tested without Svelte.
 */
export interface History {
  states: CutOp[][];
  index: number;
}

/** Maximum number of retained snapshots; the oldest are pruned. */
export const MAX_STATES = 100;

export function createHistory(): History {
  return { states: [[]], index: 0 };
}

export function currentOps(history: History): readonly CutOp[] {
  return history.states[history.index];
}

export function canUndo(history: History): boolean {
  return history.index > 0;
}

export function canRedo(history: History): boolean {
  return history.index < history.states.length - 1;
}

/** Append a committed cut, discarding any redo states. */
export function push(history: History, op: CutOp): History {
  const base = history.states.slice(0, history.index + 1);
  let states = [...base, [...currentOps(history), op]];
  if (states.length > MAX_STATES) {
    states = states.slice(states.length - MAX_STATES);
  }
  return { states, index: states.length - 1 };
}

export function undo(history: History): History {
  return canUndo(history) ? { states: history.states, index: history.index - 1 } : history;
}

export function redo(history: History): History {
  return canRedo(history) ? { states: history.states, index: history.index + 1 } : history;
}
