import { DEFAULT_FIT_OPTIONS, type CutOp } from './types';

/**
 * A hand-built operation log used to exercise the geometry engine before
 * drawing is interactive. Two cuts flush to the right and bottom edges, each
 * reflected outward, expand the square by one tab per edge.
 */
export const SAMPLE_OPS: CutOp[] = [
  {
    id: 'sample-right',
    rawPoints: [
      { x: 540, y: 380 },
      { x: 640, y: 380 },
      { x: 640, y: 460 },
      { x: 540, y: 460 },
    ],
    region: [
      { x: 540, y: 380 },
      { x: 640, y: 380 },
      { x: 640, y: 460 },
      { x: 540, y: 460 },
    ],
    fit: { strategy: 'spline', options: DEFAULT_FIT_OPTIONS },
    reflect: 'right',
  },
  {
    id: 'sample-bottom',
    rawPoints: [
      { x: 380, y: 540 },
      { x: 460, y: 540 },
      { x: 460, y: 640 },
      { x: 380, y: 640 },
    ],
    region: [
      { x: 380, y: 540 },
      { x: 460, y: 540 },
      { x: 460, y: 640 },
      { x: 380, y: 640 },
    ],
    fit: { strategy: 'spline', options: DEFAULT_FIT_OPTIONS },
    reflect: 'bottom',
  },
];
