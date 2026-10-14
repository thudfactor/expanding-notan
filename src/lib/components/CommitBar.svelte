<script lang="ts">
  import type { Edge } from '../geometry/types';

  let {
    onreflect,
    onholeonly,
    oncancel,
    onhover,
    disabledEdges = [],
  }: {
    onreflect: (edge: Edge) => void;
    onholeonly: () => void;
    oncancel: () => void;
    onhover: (edge: Edge | null) => void;
    disabledEdges?: readonly Edge[];
  } = $props();

  const isDisabled = (edge: Edge): boolean => disabledEdges.includes(edge);

  const directions: Array<{ edge: Edge; label: string }> = [
    { edge: 'left', label: 'Left' },
    { edge: 'right', label: 'Right' },
    { edge: 'top', label: 'Top' },
    { edge: 'bottom', label: 'Bottom' },
  ];
</script>

<div class="commitbar" role="toolbar" aria-label="Commit cut">
  <span class="commitbar__label">Reflect across</span>
  {#each directions as direction (direction.edge)}
    <button
      type="button"
      disabled={isDisabled(direction.edge)}
      aria-label={`Reflect across the ${direction.label.toLowerCase()} edge`}
      onclick={() => onreflect(direction.edge)}
      onmouseenter={() => onhover(isDisabled(direction.edge) ? null : direction.edge)}
      onfocus={() => onhover(isDisabled(direction.edge) ? null : direction.edge)}
      onmouseleave={() => onhover(null)}
      onblur={() => onhover(null)}
    >
      {direction.label} edge
    </button>
  {/each}
  <button
    type="button"
    class="commitbar__secondary"
    onmouseenter={() => onhover(null)}
    onfocus={() => onhover(null)}
    onclick={onholeonly}
  >
    Hole only
  </button>
  <button
    type="button"
    class="commitbar__secondary"
    onmouseenter={() => onhover(null)}
    onfocus={() => onhover(null)}
    onclick={oncancel}
  >
    Cancel
  </button>
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

  button:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
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
