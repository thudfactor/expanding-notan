<script lang="ts">
  import { onMount } from 'svelte';
  import { createNotanCanvas, type NotanCanvas } from '../paper/paperSetup';

  let host: HTMLDivElement | undefined;
  let canvas: HTMLCanvasElement | undefined;

  onMount(() => {
    if (!canvas || !host) return;

    const hostEl = host;
    const canvasEl = canvas;
    const notan: NotanCanvas = createNotanCanvas(canvasEl);

    const resize = () => {
      notan.resize(hostEl.clientWidth, hostEl.clientHeight);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(hostEl);

    return () => {
      observer.disconnect();
      notan.destroy();
    };
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
