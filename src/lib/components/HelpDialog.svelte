<script lang="ts">
  let { open = $bindable(false) }: { open?: boolean } = $props();

  let dialog: HTMLDialogElement | undefined;

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Native modal focus can scroll to the Close button; show the top.
      dialog.scrollTop = 0;
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });
</script>

<dialog bind:this={dialog} aria-labelledby="help-title" oncancel={() => (open = false)}>
  <h2 id="help-title">Help</h2>

  <section>
    <h3>What is Notan?</h3>
    <p>
      Notan is a Japanese design concept about the balance of light and dark. The
      expanding-square exercise uses simple cuts and flips to grow a composition from a
      single block of shape.
    </p>
  </section>

  <section>
    <h3>The expanding-square exercise</h3>
    <p>
      Start with a black square. Cut a shape out of it, then flip the cut piece over an
      edge so it lands outside the square. Keep cutting and flipping pieces to expand the
      design outward.
    </p>
    <ul>
      <li>A cut is freehand. It must either <strong>close on itself</strong> or
        <strong>start and end on an edge</strong>.</li>
      <li>Reflect a cut across the <strong>left, right, top, or bottom</strong> edge of the
        original square.</li>
      <li>Cut pieces can be cut again. Reflect a new cut across any of the square's four
        edges.</li>
      <li>Reflections always use a square edge, so reflecting an outside piece across the
        <em>same</em> edge brings it back toward the square (a toggle) rather than pushing
        it further out.</li>
      <li>Following the rules of Notan is up to you — the tool will not enforce them.</li>
    </ul>
  </section>

  <section>
    <h3>Using this tool</h3>
    <ul>
      <li><strong>Draw</strong> a cut by dragging on the square (mouse, pen, or touch).</li>
      <li><strong>Reflect left/right/up/down</strong> to flip the cut outward, or choose
        <strong>Hole only</strong>, or <strong>Cancel</strong> (Esc).</li>
      <li><strong>Undo / Redo</strong> with the buttons, or Cmd/Ctrl+Z and
        Shift+Cmd/Ctrl+Z.</li>
      <li><strong>Seams</strong> toggles the construction lines.</li>
      <li><strong>Export</strong> a PNG or SVG of the full artboard at any time.</li>
      <li><strong>New project</strong> clears the work (with a confirmation).</li>
      <li>Your work in progress is saved automatically in this browser.</li>
    </ul>
  </section>

  <div class="actions">
    <button type="button" onclick={() => (open = false)}>Close</button>
  </div>
</dialog>

<style>
  dialog {
    max-width: 32rem;
    max-height: 85vh;
    padding: 1.25rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    font: inherit;
    overflow-y: auto;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.35);
  }

  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.125rem;
  }

  h3 {
    margin: 1rem 0 0.375rem;
    font-size: 0.9375rem;
  }

  p,
  li {
    line-height: 1.5;
  }

  p {
    margin: 0;
  }

  ul {
    margin: 0.375rem 0 0;
    padding-left: 1.25rem;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.25rem;
  }

  .actions button {
    padding: 0.4375rem 0.875rem;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.375rem;
    background: #fff;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .actions button:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
</style>
