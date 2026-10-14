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
    <button type="button" onclick={() => (open = false)}>Cancel</button>
    <button type="button" class="danger" onclick={confirm}>{confirmLabel}</button>
  </div>
</dialog>

<style>
  dialog {
    max-width: 24rem;
    padding: 1.25rem;
    border: none;
    border-radius: 0.5rem;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    font: inherit;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.35);
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.0625rem;
  }

  p {
    margin: 0 0 1rem;
    color: rgba(0, 0, 0, 0.7);
    line-height: 1.4;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  button {
    padding: 0.4375rem 0.875rem;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.375rem;
    background: #fff;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  .danger {
    border-color: transparent;
    background: #b91c1c;
    color: #fff;
  }
</style>
