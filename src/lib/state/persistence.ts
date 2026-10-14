import type { CutOp, FitOptions } from '../geometry/types';
import type { History } from './history';

export const STORAGE_KEY = 'notan:v1:project';
export const PROJECT_VERSION = 1;

export interface ProjectSnapshot {
  version: number;
  artboard: { side: number };
  fitDefaults: FitOptions;
  seamVisible: boolean;
  history: History;
}

export interface ProjectExtras {
  artboardSide: number;
  fitDefaults: FitOptions;
  seamVisible: boolean;
}

export function createSnapshot(history: History, extras: ProjectExtras): ProjectSnapshot {
  return {
    version: PROJECT_VERSION,
    artboard: { side: extras.artboardSide },
    fitDefaults: extras.fitDefaults,
    seamVisible: extras.seamVisible,
    history,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPoints(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (point) =>
        isRecord(point) && typeof point.x === 'number' && typeof point.y === 'number',
    )
  );
}

const EDGES = ['left', 'right', 'top', 'bottom'];

function isCutOp(value: unknown): value is CutOp {
  if (!isRecord(value)) return false;
  const fit = value.fit;
  const reflect = value.reflect;
  return (
    typeof value.id === 'string' &&
    isPoints(value.rawPoints) &&
    isPoints(value.region) &&
    isRecord(fit) &&
    typeof fit.strategy === 'string' &&
    isRecord(fit.options) &&
    (reflect === null || (typeof reflect === 'string' && EDGES.includes(reflect)))
  );
}

function isHistory(value: unknown): value is History {
  if (!isRecord(value)) return false;
  const states = value.states;
  const index = value.index;
  if (!Array.isArray(states) || typeof index !== 'number') return false;
  if (!Number.isInteger(index) || index < 0 || index >= states.length) return false;
  return states.every((state) => Array.isArray(state) && state.every(isCutOp));
}

function isSnapshot(value: unknown): value is ProjectSnapshot {
  if (!isRecord(value)) return false;
  const artboard = value.artboard;
  return (
    value.version === PROJECT_VERSION &&
    isRecord(artboard) &&
    typeof artboard.side === 'number' &&
    isRecord(value.fitDefaults) &&
    typeof value.seamVisible === 'boolean' &&
    isHistory(value.history)
  );
}

/**
 * Parse and validate a stored project. Returns null for missing, malformed, or
 * unknown/newer-versions so callers can start fresh without clobbering data.
 */
export function parseSnapshot(raw: string | null): ProjectSnapshot | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  return isSnapshot(data) ? data : null;
}

export function readRaw(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeRaw(value: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage may be unavailable (private mode, quota); ignore */
  }
}

export function clearRaw(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
