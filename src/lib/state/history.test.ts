import { describe, expect, it } from 'vitest';
import type { CutOp } from '../geometry/types';
import {
  MAX_STATES,
  canRedo,
  canUndo,
  createHistory,
  currentOps,
  push,
  redo,
  undo,
} from './history';

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
    fit: { strategy: 'spline', options: { minDistance: 3, simplifyTolerance: 2, smoothing: 0.5 } },
    reflect: null,
  };
}

describe('history', () => {
  it('starts empty with nothing to undo or redo', () => {
    const history = createHistory();
    expect(currentOps(history)).toEqual([]);
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);
  });

  it('pushes committed cuts onto the log', () => {
    const history = push(push(createHistory(), op('a')), op('b'));
    expect(currentOps(history).map((cut) => cut.id)).toEqual(['a', 'b']);
    expect(canUndo(history)).toBe(true);
    expect(canRedo(history)).toBe(false);
  });

  it('walks back and forward through multiple levels', () => {
    let history = push(push(push(createHistory(), op('a')), op('b')), op('c'));

    history = undo(history);
    expect(currentOps(history).map((cut) => cut.id)).toEqual(['a', 'b']);
    history = undo(history);
    expect(currentOps(history).map((cut) => cut.id)).toEqual(['a']);
    expect(canRedo(history)).toBe(true);

    history = redo(history);
    expect(currentOps(history).map((cut) => cut.id)).toEqual(['a', 'b']);
    history = redo(history);
    expect(currentOps(history).map((cut) => cut.id)).toEqual(['a', 'b', 'c']);
    expect(canRedo(history)).toBe(false);
  });

  it('does not undo past the start or redo past the end', () => {
    const history = createHistory();
    expect(undo(history)).toBe(history);
    expect(redo(history)).toBe(history);
  });

  it('discards redo states when a new cut is committed after undo', () => {
    let history = push(push(createHistory(), op('a')), op('b'));
    history = undo(history);
    history = push(history, op('c'));

    expect(currentOps(history).map((cut) => cut.id)).toEqual(['a', 'c']);
    expect(canRedo(history)).toBe(false);
  });

  it('caps the number of retained snapshots, pruning the oldest', () => {
    let history = createHistory();
    for (let i = 0; i < MAX_STATES + 10; i++) history = push(history, op(`op-${i}`));

    expect(history.states.length).toBe(MAX_STATES);
    // The oldest states were pruned, so undo cannot reach the very first cut.
    let walked = history;
    while (canUndo(walked)) walked = undo(walked);
    expect(walked.index).toBe(0);
    expect(currentOps(walked).length).toBe(11);
  });
});
