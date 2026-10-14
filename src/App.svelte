<script lang="ts">
  import Canvas from './lib/components/Canvas.svelte';
  import Toolbar from './lib/components/Toolbar.svelte';
  import { redo, undo } from './lib/state/project.svelte';

  function onKeydown(event: KeyboardEvent): void {
    const modifier = event.metaKey || event.ctrlKey;
    if (!modifier || event.key.toLowerCase() !== 'z') return;
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app">
  <header class="app__toolbar">
    <h1 class="app__title">Notan — Expanding the Square</h1>
    <Toolbar />
  </header>

  <main class="app__workspace">
    <Canvas />
  </main>
</div>
