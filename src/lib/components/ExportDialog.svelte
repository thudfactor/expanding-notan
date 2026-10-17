<script lang="ts">
  import {
    DEFAULT_EXPORT,
    runExport,
    type ExportBackground,
    type ExportFormat,
  } from '../export/exporter';
  import { getOps } from '../state/project.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let format = $state<ExportFormat>(DEFAULT_EXPORT.format);
  let background = $state<ExportBackground>(DEFAULT_EXPORT.background);
  let scale = $state(DEFAULT_EXPORT.scale);
  let includeSeams = $state(DEFAULT_EXPORT.includeSeams);
  let busy = $state(false);

  let dialog: HTMLDialogElement | undefined;

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (busy) return;
    busy = true;
    try {
      await runExport(getOps(), { format, background, scale, includeSeams });
      open = false;
    } finally {
      busy = false;
    }
  }
</script>

<dialog bind:this={dialog} aria-labelledby="export-title" oncancel={() => (open = false)}>
  <form onsubmit={submit}>
    <h2 id="export-title">Export</h2>

    <fieldset>
      <legend>Format</legend>
      <label><input type="radio" bind:group={format} value="png" /> PNG</label>
      <label><input type="radio" bind:group={format} value="svg" /> SVG</label>
    </fieldset>

    <fieldset>
      <legend>Background</legend>
      <label><input type="radio" bind:group={background} value="white" /> White</label>
      <label><input type="radio" bind:group={background} value="transparent" /> Transparent</label>
    </fieldset>

    <fieldset>
      <legend>PNG scale</legend>
      <label><input type="radio" bind:group={scale} value={1} /> 1x</label>
      <label><input type="radio" bind:group={scale} value={2} /> 2x</label>
      <label><input type="radio" bind:group={scale} value={3} /> 3x</label>
    </fieldset>

    <label class="check"><input type="checkbox" bind:checked={includeSeams} /> Include seam lines</label>

    <div class="actions">
      <button type="button" class="btn btn--lg" onclick={() => (open = false)}>Cancel</button>
      <button type="submit" class="btn btn--lg btn--primary" disabled={busy}>{busy ? 'Exporting…' : 'Export'}</button>
    </div>
  </form>
</dialog>

<style>
  dialog {
    min-width: 20rem;
  }

  fieldset {
    margin: 0 0 0.75rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.375rem;
  }

  legend {
    padding: 0 0.25rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(0, 0, 0, 0.55);
  }

  label {
    margin-right: 0.875rem;
    font-size: 0.875rem;
  }

  .check {
    display: block;
    margin: 0 0 1rem;
  }
</style>
