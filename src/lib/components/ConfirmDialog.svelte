<script lang="ts">
  let {
    open = $bindable(false),
    title,
    message,
    confirmLabel = 'Confirm',
    onconfirm,
  }: {
    open?: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onconfirm?: () => void;
  } = $props();

  let dialog: HTMLDialogElement | undefined;

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  function confirm(): void {
    open = false;
    onconfirm?.();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="confirm-title" oncancel={() => (open = false)}>
  <h2 id="confirm-title">{title}</h2>
  <p>{message}</p>
  <div class="actions">
    <button type="button" class="btn btn--lg" onclick={() => (open = false)}>Cancel</button>
    <button type="button" class="btn btn--lg btn--danger" onclick={confirm}>{confirmLabel}</button>
  </div>
</dialog>

<style>
  dialog {
    max-width: 24rem;
  }

  p {
    margin: 0 0 1rem;
    color: rgba(0, 0, 0, 0.7);
    line-height: 1.4;
  }
</style>
