import Paper from 'paper';
import { ARTBOARD_SIZE, squareRect, type Rect } from './artboard';
import { mirrorPoints } from './math';
import type { CutOp, Pt } from './types';

export type PaperScope = InstanceType<typeof Paper.PaperScope>;
export type PaperPathItem = InstanceType<typeof Paper.PathItem>;

/**
 * A Paper scope backed by a project but no canvas — enough for boolean geometry
 * and unit tests. Items are not auto-inserted into the scene.
 */
export function createHeadlessScope(): PaperScope {
  const scope = new Paper.PaperScope();
  scope.setup(new scope.Size(ARTBOARD_SIZE, ARTBOARD_SIZE));
  scope.settings.insertItems = false;
  return scope;
}

function pathFromRect(scope: PaperScope, rect: Rect): PaperPathItem {
  return new scope.Path.Rectangle(rect);
}

function pathFromPoints(scope: PaperScope, points: readonly Pt[]): PaperPathItem {
  const path = new scope.Path(points.map((p) => [p.x, p.y]));
  path.closed = true;
  return path;
}

/**
 * Replay the operation log into the black silhouette. Starts from the square,
 * subtracts each op's region (leaving a hole), and — when the op reflects —
 * unions the region mirrored across the chosen square edge.
 */
export function buildSilhouette(
  scope: PaperScope,
  ops: readonly CutOp[],
  square: Rect = squareRect(),
): PaperPathItem {
  let silhouette: PaperPathItem = pathFromRect(scope, square);

  for (const op of ops) {
    silhouette = silhouette.subtract(pathFromPoints(scope, op.rawPoints));
    if (op.reflect) {
      const mirrored = pathFromPoints(scope, mirrorPoints(op.rawPoints, op.reflect, square));
      silhouette = silhouette.unite(mirrored);
    }
  }

  return silhouette;
}
