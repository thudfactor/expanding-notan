# 0010. Toggleable seam layer

- Status: Accepted
- Date: 2026-10-14

## Context

The physical exercise leaves visible edges where a piece was cut and flipped. Showing those
"seams" helps users read the construction, but the finished Notan is a pure black-on-white
silhouette with no internal lines.

## Decision

- Seams are a separate, toggleable overlay, not part of the silhouette. Toggling them never
  changes the artwork.
- Seam geometry is the boundary outline of each cut region and of each mirrored copy
  (`buildSeamOutlines` in `engine.ts`), stroked as thin, translucent white lines drawn above
  the black silhouette and below the interactive preview.
- Visibility is a setting (`seamVisible`), not an undoable transformation — it is not part
  of the operation log. It is persisted with the project and defaults to on screen, off in
  export.

## Consequences

- Users can switch between a clean silhouette and a construction view.
- Output (export) can exclude seams so the artwork stays a pure silhouette (see export).
- Seams are recomputed from the op log; no extra persisted geometry.
- Outline-based seams are an approximation of "where pieces actually touch"; good enough
  for MVP and cheap to compute.

## Alternatives considered

- Baking seams into the silhouette: would corrupt the artwork and block a clean export.
- Computing exact shared-boundary segments via booleans: more faithful but more complex,
  and unnecessary for a subtle construction hint.
