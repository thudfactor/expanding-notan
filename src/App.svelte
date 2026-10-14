<script lang="ts">
  import Canvas from './lib/components/Canvas.svelte';
  import { SAMPLE_OPS } from './lib/geometry/sample';
</script>

<div class="app">
  <header class="app__toolbar">
    <h1 class="app__title">Notan — Expanding the Square</h1>
  </header>

  <main class="app__workspace">
    <Canvas ops={SAMPLE_OPS} />
  </main>
</div>
