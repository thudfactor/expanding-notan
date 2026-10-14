import Paper from 'paper';
import { ARTBOARD_SIZE, artboardRect, fitScale } from '../geometry/artboard';
import { buildSilhouette, type PaperPathItem, type PaperScope } from '../geometry/engine';
import type { CutOp } from '../geometry/types';

/** Viewport padding (CSS px) left around the fitted artboard. */
const VIEW_PADDING = 16;

export type PaperProject = InstanceType<typeof Paper.Project>;
export type PaperView = InstanceType<typeof Paper.View>;

export interface NotanCanvas {
  readonly scope: PaperScope;
  readonly project: PaperProject;
  readonly view: PaperView;
  /** Rebuild the black silhouette from the operation log. */
  setOps(ops: readonly CutOp[]): void;
  /** Fit the artboard into a viewport of the given CSS pixel size. */
  resize(width: number, height: number): void;
  destroy(): void;
}

/**
 * Create the Paper.js scene for the artboard: a white board with the black
 * silhouette derived from the operation log. Geometry is kept in logical
 * artboard units; the view scales it to fit the viewport.
 */
export function createNotanCanvas(canvas: HTMLCanvasElement): NotanCanvas {
  const scope = new Paper.PaperScope();
  scope.setup(canvas);
  scope.settings.insertItems = false;

  const project = scope.project;
  const view = scope.view;
  const layer = project.activeLayer;

  const background = new scope.Path.Rectangle(artboardRect());
  background.fillColor = new scope.Color('#ffffff');
  background.name = 'artboard';
  layer.addChild(background);

  let silhouette: PaperPathItem | undefined;

  function setOps(ops: readonly CutOp[]): void {
    if (silhouette) {
      silhouette.remove();
      silhouette = undefined;
    }
    const next = buildSilhouette(scope, ops);
    next.fillColor = new scope.Color('#111111');
    next.name = 'silhouette';
    layer.addChild(next);
    silhouette = next;
  }

  function resize(width: number, height: number): void {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    view.viewSize = new scope.Size(w, h);
    view.zoom = fitScale(w, h, VIEW_PADDING);
    view.center = new scope.Point(ARTBOARD_SIZE / 2, ARTBOARD_SIZE / 2);
  }

  function destroy(): void {
    project.clear();
    project.remove();
  }

  return { scope, project, view, setOps, resize, destroy };
}
