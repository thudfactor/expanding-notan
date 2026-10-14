import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CutOp } from '../geometry/types';
import * as history from './history';
import {
  PROJECT_VERSION,
  clearRaw,
  createSnapshot,
  parseSnapshot,
  readRaw,
  writeRaw,
} from './persistence';

const EXTRAS = {
  artboardSide: 880,
  fitDefaults: { minDistance: 3, simplifyTolerance: 2, smoothing: 0.5 },
  seamVisible: true,
};

function op(id: string): CutOp {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];
  return {
    id,
    rawPoints: points,
    region: points,
    fit: { strategy: 'spline', options: EXTRAS.fitDefaults },
    reflect: 'right',
  };
}

describe('snapshot round-trip', () => {
  it('creates and parses a valid snapshot', () => {
    const source = history.push(history.push(history.createHistory(), op('a')), op('b'));
    const snapshot = createSnapshot(source, EXTRAS);

    expect(snapshot.version).toBe(PROJECT_VERSION);
    expect(snapshot.artboard.side).toBe(880);

    const parsed = parseSnapshot(JSON.stringify(snapshot));
    expect(parsed).not.toBeNull();
    expect(parsed!.history.states.length).toBe(source.states.length);
    expect(parsed!.history.index).toBe(source.index);
    expect(parsed!.history.states[source.index].map((cut) => cut.id)).toEqual(['a', 'b']);
  });

  it('rejects missing, malformed, and foreign data', () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot('not json')).toBeNull();
    expect(parseSnapshot('{}')).toBeNull();
    expect(parseSnapshot(JSON.stringify({ version: 999, history: { states: [[]], index: 0 } }))).toBeNull();
    expect(
      parseSnapshot(
        JSON.stringify({
          version: PROJECT_VERSION,
          artboard: { side: 880 },
          fitDefaults: EXTRAS.fitDefaults,
          seamVisible: true,
          history: { states: 'nope', index: 0 },
        }),
      ),
    ).toBeNull();
  });

  it('rejects a snapshot whose cursor is out of range', () => {
    const snapshot = createSnapshot(history.createHistory(), EXTRAS);
    const broken = { ...snapshot, history: { states: [[]], index: 5 } };
    expect(parseSnapshot(JSON.stringify(broken))).toBeNull();
  });
});

describe('localStorage access', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes, reads, and clears the project key', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    });

    expect(readRaw()).toBeNull();
    writeRaw('{"hello":true}');
    expect(readRaw()).toBe('{"hello":true}');
    clearRaw();
    expect(readRaw()).toBeNull();
  });
});
