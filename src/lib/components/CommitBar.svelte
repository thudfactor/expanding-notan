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
    <div class="piece" role="radiogroup" aria-label="Cut piece">
      <span class="commitbar__label" aria-hidden="true">Cut piece</span>
      <div class="piece__options">
        <label class="piece__option">
          <input
            type="radio"
            name="cut-piece"
            value="smaller"
            checked={selectedPiece === 0}
            onchange={() => onselectpiece?.(0)}
          />
          <span class="piece__face">Smaller</span>
        </label>
        <label class="piece__option">
          <input
            type="radio"
            name="cut-piece"
            value="larger"
            checked={selectedPiece === 1}
            onchange={() => onselectpiece?.(1)}
          />
          <span class="piece__face">Larger</span>
        </label>
      </div>
    </div>
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

  /* Piece chooser: a segmented radio group, not action buttons, so the state
     reads as a selection rather than a commit. */
  .piece {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin: 0;
    padding: 0;
    border: none;
  }

  .piece__options {
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--border-strong);
    border-radius: 0.375rem;
    background: rgba(0, 0, 0, 0.05);
  }

  .piece__option {
    position: relative;
    display: inline-flex;
  }

  .piece__option input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .piece__face {
    min-width: 3.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8125rem;
    text-align: center;
    pointer-events: none;
  }

  .piece__option input:checked + .piece__face {
    background: var(--surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
    font-weight: 600;
  }

  .piece__option input:focus-visible + .piece__face {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
</style>
