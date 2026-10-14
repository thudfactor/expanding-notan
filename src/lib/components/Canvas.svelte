<script lang="ts">
  import { onMount } from 'svelte';
  import { createNotanCanvas, type NotanCanvas } from '../paper/paperSetup';
  import type { CutOp } from '../geometry/types';

  let { ops = [] }: { ops?: readonly CutOp[] } = $props();

  let host: HTMLDivElement | undefined;
  let canvas: HTMLCanvasElement | undefined;
  // `$state.raw` keeps Paper.js objects uninstrumented by Svelte's proxy.
  let notan = $state.raw<NotanCanvas | undefined>(undefined);

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

  // Rebuild the silhouette whenever the operation log changes.
  $effect(() => {
    notan?.setOps(ops);
  });
</script>

<div class="canvas-host" bind:this={host}>
  <canvas bind:this={canvas} aria-label="Notan drawing area"></canvas>
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
</style>
