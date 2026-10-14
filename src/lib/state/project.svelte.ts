import { ARTBOARD_SIZE } from '../geometry/artboard';
import { DEFAULT_FIT_OPTIONS, type CutOp } from '../geometry/types';
import * as history from './history';
import { clearRaw, createSnapshot, parseSnapshot, readRaw, writeRaw, type ProjectExtras } from './persistence';

const SAVE_DELAY = 400;

const extras: ProjectExtras = {
  artboardSide: ARTBOARD_SIZE,
  fitDefaults: DEFAULT_FIT_OPTIONS,
  seamVisible: true,
};

function initialHistory(): history.History {
  const saved = parseSnapshot(readRaw());
  return saved ? saved.history : history.createHistory();
}

/**
 * App-facing project state: a runes store wrapping the pure snapshot history and
 * persisting to localStorage. `$state.raw` avoids deep-proxying the geometry.
 */
let state = $state.raw<history.History>(initialHistory());

let saveTimer: ReturnType<typeof setTimeout> | undefined;

function saveNow(): void {
  if (saveTimer !== undefined) {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  writeRaw(JSON.stringify(createSnapshot(state, extras)));
}

/** Debounced autosave, triggered by every mutation. */
function scheduleSave(): void {
  if (typeof setTimeout === 'undefined') return;
  if (saveTimer !== undefined) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, SAVE_DELAY);
}

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
  scheduleSave();
}

export function undo(): void {
  state = history.undo(state);
  scheduleSave();
}

export function redo(): void {
  state = history.redo(state);
  scheduleSave();
}

/** Clear the project and its stored data (used by "New project"). */
export function resetProject(): void {
  if (saveTimer !== undefined) {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  state = history.createHistory();
  clearRaw();
}
