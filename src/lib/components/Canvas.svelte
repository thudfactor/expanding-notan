<script lang="ts">
  import { onMount } from 'svelte';
  import CommitBar from './CommitBar.svelte';
  import { createNotanCanvas, type NotanCanvas } from '../paper/paperSetup';
  import { ARTBOARD_SIZE, squareRect } from '../geometry/artboard';
  import { getFitter } from '../geometry/fit';
  import { intersectsArtboard, mirrorPoints } from '../geometry/math';
  import { DEFAULT_CLOSURE, closeRegion } from '../geometry/tracing';
  import { DEFAULT_FIT_OPTIONS, type CutOp, type Edge, type Pt } from '../geometry/types';
  import { addCut, getOps, getSeamVisible } from '../state/project.svelte';

  const STRATEGY = 'spline';

  let host: HTMLDivElement | undefined;
  let canvas: HTMLCanvasElement | undefined;
  // `$state.raw` keeps Paper.js objects uninstrumented by Svelte's proxy.
  let notan = $state.raw<NotanCanvas | undefined>(undefined);
  let hint = $state('');
  let pending = $state<{ region: Pt[]; snapPoints: Pt[]; rawPoints: Pt[] } | undefined>(undefined);

  const EDGES = ['left', 'right', 'top', 'bottom'] as const;

  // Axes whose reflection would place the cut entirely off the artboard.
  const disabledEdges = $derived.by((): Edge[] => {
    const current = pending;
    if (!current) return [];
    const square = squareRect();
    return EDGES.filter(
      (edge) => !intersectsArtboard(mirrorPoints(current.region, edge, square), ARTBOARD_SIZE),
    );
  });

  let drawing = false;
  let capture: Pt[] = [];

  function toArtboard(event: PointerEvent): Pt | undefined {
    if (!notan || !canvas) return undefined;
    const bounds = canvas.getBoundingClientRect();
    const viewPoint = new notan.scope.Point(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    );
    const point = notan.view.viewToProject(viewPoint);
    return { x: point.x, y: point.y };
  }

  function onPointerDown(event: PointerEvent): void {
    if (!notan || event.button !== 0) return;
    const point = toArtboard(event);
    if (!point) return;

    drawing = true;
    capture = [point];
    hint = '';
    pending = undefined;
    try {
      canvas?.setPointerCapture(event.pointerId);
    } catch {
      /* synthetic or already-released pointer; drawing still works */
    }
    notan.clearPreview();
    notan.setLiveStroke(capture);
  }

  function onPointerMove(event: PointerEvent): void {
    if (!drawing || !notan) return;
    const point = toArtboard(event);
    if (!point) return;

    const last = capture[capture.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) >= DEFAULT_FIT_OPTIONS.minDistance) {
      capture.push(point);
      notan.setLiveStroke(capture);
    }
  }

  function onPointerUp(event: PointerEvent): void {
    if (!drawing || !notan) return;
    drawing = false;
    try {
      canvas?.releasePointerCapture(event.pointerId);
    } catch {
      /* pointer capture may not have been established */
    }

    const silhouette = notan.getSilhouette();
    if (!silhouette) return;

    const fitted = getFitter(STRATEGY).fit(capture, DEFAULT_FIT_OPTIONS);
    const result = closeRegion(notan.scope, fitted, silhouette, DEFAULT_CLOSURE);

    if (!result) {
      hint = 'A cut must close on itself or start and end on an edge.';
      notan.clearPreview();
      return;
    }

    pending = { region: result.region, snapPoints: result.snapPoints, rawPoints: capture.slice() };
    notan.showPreviewRegion(result.region, result.snapPoints);
  }

  function commit(reflect: Edge | null): void {
    if (!pending || !notan) return;

    const op: CutOp = {
      id: crypto.randomUUID(),
      rawPoints: pending.rawPoints,
      region: pending.region,
      fit: { strategy: STRATEGY, options: DEFAULT_FIT_OPTIONS },
      reflect,
    };

    pending = undefined;
    hint = '';
    notan.clearPreview();
    addCut(op);
  }

  function onHover(edge: Edge | null): void {
    if (!notan || !pending) return;
    if (!edge) {
      notan.setHover(null, null);
      return;
    }
    const mirrored = mirrorPoints(pending.region, edge, squareRect());
    notan.setHover(edge, mirrored);
  }

  function cancel(): void {
    pending = undefined;
    hint = '';
    notan?.clearPreview();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && pending) cancel();
  }

  onMount(() => {
    if (!canvas || !host) return;

    const hostEl = host;
    const canvasEl = canvas;
    const instance = createNotanCanvas(canvasEl);
    notan = instance;

    const resize = () => {
      instance.resize(hostEl.clientWidth, hostEl.clientHeight);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(hostEl);

    // Signal readiness for screenshot/automation tooling after the first paint.
    requestAnimationFrame(() => {
      document.body.dataset.notanReady = 'true';
    });

    return () => {
      observer.disconnect();
      instance.destroy();
      notan = undefined;
      delete document.body.dataset.notanReady;
    };
  });

  // Rebuild the scene whenever the operation log or seam visibility changes.
  $effect(() => {
    notan?.setScene(getOps(), getSeamVisible());
  });
</script>

<svelte:window onkeydown={onKeydown} />

<div class="canvas-host" bind:this={host}>
  <canvas
    bind:this={canvas}
    aria-label="Notan drawing area"
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
  ></canvas>

  {#if pending}
    <CommitBar
      onreflect={(edge) => commit(edge)}
      onholeonly={() => commit(null)}
      oncancel={cancel}
      onhover={onHover}
      disabledEdges={disabledEdges}
    />
  {:else if hint}
    <p class="hint" role="status">{hint}</p>
  {/if}
</div>

<style>
  .canvas-host {
    position: absolute;
    inset: 0;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: crosshair;
  }

  .hint {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    margin: 0;
    padding: 0.5rem 0.75rem;
    transform: translateX(-50%);
    border-radius: 0.375rem;
    background: rgba(17, 17, 17, 0.85);
    color: #fff;
    font-size: 0.875rem;
  }
</style>
