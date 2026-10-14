import { describe, expect, it } from 'vitest';
import {
  ARTBOARD_SIZE,
  SQUARE_MARGIN,
  SQUARE_SIDE,
  artboardRect,
  fitScale,
  squareRect,
} from './artboard';

describe('artboard constants', () => {
  it('uses a margin of exactly 60% of the square side', () => {
    expect(SQUARE_MARGIN).toBeCloseTo(SQUARE_SIDE * 0.6);
  });

  it('sizes the artboard as the square plus a margin on both sides', () => {
    expect(ARTBOARD_SIZE).toBeCloseTo(SQUARE_SIDE + 2 * SQUARE_MARGIN);
  });
});

describe('squareRect', () => {
  it('centers the square horizontally and vertically in the artboard', () => {
    const board = artboardRect();
    const square = squareRect();

    const leftGap = square.x - board.x;
    const rightGap = board.x + board.width - (square.x + square.width);
    const topGap = square.y - board.y;
    const bottomGap = board.y + board.height - (square.y + square.height);

    expect(leftGap).toBeCloseTo(rightGap);
    expect(topGap).toBeCloseTo(bottomGap);
    expect(leftGap).toBeCloseTo(SQUARE_MARGIN);
  });
});

describe('fitScale', () => {
  it('fits by the constraining dimension, preserving aspect ratio', () => {
    expect(fitScale(1000, 500)).toBeCloseTo(500 / ARTBOARD_SIZE);
    expect(fitScale(500, 1000)).toBeCloseTo(500 / ARTBOARD_SIZE);
  });

  it('accounts for padding on every side', () => {
    expect(fitScale(1000, 1000, 50)).toBeCloseTo(900 / ARTBOARD_SIZE);
  });

  it('never returns a negative scale for tiny viewports', () => {
    expect(fitScale(10, 10, 50)).toBe(0);
  });
});
