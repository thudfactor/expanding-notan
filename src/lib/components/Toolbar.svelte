<script lang="ts">
  import ConfirmDialog from './ConfirmDialog.svelte';
  import {
    canRedo,
    canUndo,
    getSeamVisible,
    redo,
    resetProject,
    toggleSeams,
    undo,
  } from '../state/project.svelte';

  let confirmNew = $state(false);
</script>

<div class="toolbar" role="toolbar" aria-label="Edit actions">
  <button type="button" disabled={!canUndo()} onclick={undo}>Undo</button>
  <button type="button" disabled={!canRedo()} onclick={redo}>Redo</button>
  <button type="button" aria-pressed={getSeamVisible()} onclick={toggleSeams}>Seams</button>
  <button type="button" onclick={() => (confirmNew = true)}>New project</button>
</div>

<ConfirmDialog
  bind:open={confirmNew}
  title="Start a new project?"
  message="This will permanently discard your current work in progress."
  confirmLabel="New project"
  onconfirm={resetProject}
/>

<style>
  .toolbar {
    display: flex;
    gap: 0.375rem;
    margin-left: auto;
  }

  button {
    padding: 0.375rem 0.75rem;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.375rem;
    background: #fff;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.04);
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  button[aria-pressed='true'] {
    border-color: #2563eb;
    background: #2563eb;
    color: #fff;
  }

  button[aria-pressed='true']:hover {
    background: #2563eb;
  }

  button:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
</style>
