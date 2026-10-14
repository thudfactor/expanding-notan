/** Logical design units. All persisted geometry is expressed in these units. */
export const SQUARE_SIDE = 400;

/**
 * Required margin on every side of the square. The spec requires "at minimum
 * 60% the width of the square"; we use exactly 60%.
 */
export const SQUARE_MARGIN = SQUARE_SIDE * 0.6;

/** Total artboard size: the square plus its margin on both sides. */
export const ARTBOARD_SIZE = SQUARE_SIDE + 2 * SQUARE_MARGIN;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The black square, centered in the artboard. */
export function squareRect(): Rect {
  return {
    x: SQUARE_MARGIN,
    y: SQUARE_MARGIN,
    width: SQUARE_SIDE,
    height: SQUARE_SIDE,
  };
}

/** The full artboard, origin at the top-left. */
export function artboardRect(): Rect {
  return { x: 0, y: 0, width: ARTBOARD_SIZE, height: ARTBOARD_SIZE };
}

/**
 * Scale factor that fits the whole artboard into a viewport while preserving
 * aspect ratio. `padding` is subtracted from every side of the viewport.
 */
export function fitScale(
  viewportWidth: number,
  viewportHeight: number,
  padding = 0,
): number {
  const availableWidth = Math.max(0, viewportWidth - padding * 2);
  const availableHeight = Math.max(0, viewportHeight - padding * 2);
  return Math.min(availableWidth / ARTBOARD_SIZE, availableHeight / ARTBOARD_SIZE);
}
