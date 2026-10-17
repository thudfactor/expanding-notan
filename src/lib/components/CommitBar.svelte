<script lang="ts">
  import type { Edge } from '../geometry/types';

  let {
    onreflect,
    onholeonly,
    oncancel,
    onhover,
    disabledEdges = [],
    pieceCount = 1,
    selectedPiece = 0,
    onselectpiece,
  }: {
    onreflect: (edge: Edge) => void;
    onholeonly: () => void;
    oncancel: () => void;
    onhover: (edge: Edge | null) => void;
    disabledEdges?: readonly Edge[];
    /** Number of candidate cut pieces; >1 means the user must choose. */
    pieceCount?: number;
    selectedPiece?: number;
    onselectpiece?: (index: number) => void;
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
  {#if pieceCount > 1}
    <span class="commitbar__label">Cut piece</span>
    <button
      type="button"
      class="btn"
      aria-pressed={selectedPiece === 0}
      aria-label="Use the smaller cut piece"
      onclick={() => onselectpiece?.(0)}
    >
      Smaller
    </button>
    <button
      type="button"
      class="btn"
      aria-pressed={selectedPiece === 1}
      aria-label="Use the larger cut piece"
      onclick={() => onselectpiece?.(1)}
    >
      Larger
    </button>
  {/if}
  <span class="commitbar__label">Reflect across</span>
  {#each directions as direction (direction.edge)}
    <button
      type="button"
      class="btn btn--primary"
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
    class="btn btn--ghost"
    onmouseenter={() => onhover(null)}
    onfocus={() => onhover(null)}
    onclick={onholeonly}
  >
    Hole only
  </button>
  <button
    type="button"
    class="btn btn--ghost"
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
</style>
