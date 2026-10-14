# 0004. Reflection semantics

- Status: Accepted
- Date: 2026-10-14

## Context

In the expanding-square exercise, cut pieces are flipped outward across an edge. We must
define the axis and the exact boolean behavior, including for cuts made on already
reflected pieces.

## Decision

- Reflection axes are the four original square edges (left/right/top/bottom). Reflected
  pieces do not introduce new coordinate frames.
- Committing a cut performs `silhouette = silhouette − region`; when reflecting, it then
  performs `silhouette = silhouette ∪ mirror(region, edge)`.
- The axis coordinate is the square edge: left `x = 240`, right `x = 640`, top `y = 240`,
  bottom `y = 640`. Mirroring negates the perpendicular component.
- One edge per action; multiple sides means multiple ops. `reflect: null` means a hole
  with no reflection.
- Cuts on reflected pieces use the same rule: the region is subtracted from the whole
  silhouette and its mirror across an edge is added.

## Consequences

- One uniform rule handles multi-level expansion; no per-piece transform tracking.
- Reflected copies are recomputed from the op log, so results are deterministic.
- Boolean results can be compound paths (outer boundary plus holes), handled by Paper.js.
- MVP is limited to edge-aligned reflections; free-form rotation is deferred.

## Alternatives considered

- Reflecting across the edge of the piece being cut: truer to physical paper, but needs
  per-piece coordinate frames and complicates undo/persistence.
- Symmetric multi-edge reflection in one step: deferred; expressible as multiple ops.
