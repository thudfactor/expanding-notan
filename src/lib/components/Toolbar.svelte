<script lang="ts">
  import ConfirmDialog from './ConfirmDialog.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import HelpDialog from './HelpDialog.svelte';
  import {
    canRedo,
    canUndo,
    getHadSavedProject,
    getSeamVisible,
    redo,
    resetProject,
    toggleSeams,
    undo,
  } from '../state/project.svelte';

  let confirmNew = $state(false);
  let exportOpen = $state(false);
  // First-run onboarding: open Help automatically when there is no saved project.
  let helpOpen = $state(!getHadSavedProject());
</script>

<div class="toolbar" role="toolbar" aria-label="Edit actions">
  <button type="button" class="btn" disabled={!canUndo()} onclick={undo}>Undo</button>
  <button type="button" class="btn" disabled={!canRedo()} onclick={redo}>Redo</button>
  <button type="button" class="btn" aria-pressed={getSeamVisible()} onclick={toggleSeams}>Seams</button>
  <button type="button" class="btn" onclick={() => (exportOpen = true)}>Export</button>
  <button type="button" class="btn" onclick={() => (confirmNew = true)}>New project</button>
  <button type="button" class="btn" onclick={() => (helpOpen = true)}>Help</button>
</div>

<ConfirmDialog
  bind:open={confirmNew}
  title="Start a new project?"
  message="This will permanently discard your current work in progress."
  confirmLabel="New project"
  onconfirm={resetProject}
/>

<ExportDialog bind:open={exportOpen} />

<HelpDialog bind:open={helpOpen} />

<style>
  .toolbar {
    display: flex;
    gap: 0.375rem;
    margin-left: auto;
  }
</style>
