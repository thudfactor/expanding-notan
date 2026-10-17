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
  <header>
    <h2 id="help-title">Getting Started</h2>
    <button type="button" class="btn btn--lg" onclick={() => (open = false)}>Close</button>
  </header>

  <p>
    This is a classic art exercise. You cut shapes out of a black square, then flip those shapes across one of the edges
    of the square. Once you have some flipped shapes, you can cut more shapes out of those, flipping them back in
    towards the square.
  </p>

  <p>The goal is to create a design that "feels" balanced.</p>

  <p>
    In the physical world, you would use construction paper, scissors, or a glue-stick. Here, you can draw cuts into the
    square using your mouse, stylus, or finger (depending on, you know, what device you're on). You must close these
    shapes either by starting and ending on an edge of a square or cut shape.
  </p>

  <p>
    Once you have a design you like, you can use the "export" button in the upper right to save your artwork as an SVG
    or PNG.
  </p>

  <p>
    Your work is saved in your browser as you go, but you can have only one work in progress at a time. Export the
    images of anything you would like to keep!
  </p>
</dialog>

<style>
  dialog {
    max-width: 32rem;
    max-height: 85vh;
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
  }

  h2 {
    font-size: 1.125rem;
  }

  p {
    margin: 1lh;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-block-end: 2lh;
  }
</style>
