import { describe, expect, it } from 'vitest';
import type { CutOp } from '../geometry/types';
import { DEFAULT_EXPORT, buildExportScene, exportFilename } from './exporter';

function op(id: string, reflect: CutOp['reflect']): CutOp {
  const points = [
    { x: 540, y: 400 },
    { x: 640, y: 400 },
    { x: 640, y: 480 },
    { x: 540, y: 480 },
  ];
  return {
    id,
    rawPoints: points,
    region: points,
    fit: { strategy: 'spline', options: { minDistance: 3, simplifyTolerance: 2, smoothing: 0.5 } },
    reflect,
  };
}

function names(ops: readonly CutOp[], config = DEFAULT_EXPORT): string[] {
  return buildExportScene(ops, config).project.activeLayer.children.map((child) => child.name);
}

describe('buildExportScene', () => {
  it('adds a white background and the silhouette by default', () => {
    expect(names([])).toEqual(['background', 'silhouette']);
  });

  it('omits the background for transparent exports', () => {
    expect(names([], { ...DEFAULT_EXPORT, background: 'transparent' })).toEqual(['silhouette']);
  });

  it('adds one seam outline per region and mirror when enabled', () => {
    expect(names([op('a', 'right')], { ...DEFAULT_EXPORT, includeSeams: true })).toEqual([
      'background',
      'silhouette',
      'seam',
      'seam',
    ]);
  });
});

describe('exportFilename', () => {
  it('uses a notan-<format>-<timestamp>.<ext> pattern', () => {
    const name = exportFilename('png', new Date(2026, 9, 14, 9, 5, 3));
    expect(name).toBe('notan-png-20261014-090503.png');
  });
});
