<script lang="ts">
  import type { Edge } from '../geometry/types';

  let {
    onreflect,
    onholeonly,
    oncancel,
  }: {
    onreflect: (edge: Edge) => void;
    onholeonly: () => void;
    oncancel: () => void;
  } = $props();

  const directions: Array<{ edge: Edge; label: string }> = [
    { edge: 'left', label: 'Reflect left' },
    { edge: 'right', label: 'Reflect right' },
    { edge: 'top', label: 'Reflect up' },
    { edge: 'bottom', label: 'Reflect down' },
  ];
</script>

<div class="commitbar" role="toolbar" aria-label="Commit cut">
  <span class="commitbar__label">Cut</span>
  {#each directions as direction (direction.edge)}
    <button type="button" onclick={() => onreflect(direction.edge)}>{direction.label}</button>
  {/each}
  <button type="button" class="commitbar__secondary" onclick={onholeonly}>Hole only</button>
  <button type="button" class="commitbar__secondary" onclick={oncancel}>Cancel</button>
</div>

<style>
  .commitbar {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem;
    transform: translateX(-50%);
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  }

  .commitbar__label {
    padding: 0 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.6);
  }

  button {
    padding: 0.375rem 0.625rem;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    background: var(--accent, #2563eb);
    color: #fff;
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  button:hover {
    filter: brightness(1.08);
  }

  button:focus-visible {
    outline: 2px solid #111;
    outline-offset: 2px;
  }

  .commitbar__secondary {
    background: transparent;
    color: #1a1a1a;
    border-color: rgba(0, 0, 0, 0.2);
  }
</style>
