# 0009. Cut validity and snap-to-any-artwork-edge

- Status: Accepted
- Date: 2026-10-14

## Context

A cut must define a 2D region before it can be subtracted and reflected. Users draw
freehand, so the tool must decide when a stroke is a valid cut and how it meets the
artwork boundary.

## Decision

A stroke is a valid cut when either:

- it closes on itself (start within `closeThreshold` of the end), or
- both endpoints snap to an edge of the current black silhouette (within `snapThreshold`)
  and the straight chord between them follows that boundary (sampled within
  `boundaryTolerance`).

Endpoints may snap to **any** edge of the silhouette — the outer boundary or a hole
boundary, including reflected pieces. The resolved region is clipped to the current black
silhouette (`region = closedStroke ∩ silhouette`), so only black is cut. Regions smaller
than `minArea` are rejected, and invalid strokes are discarded with a hint.

Implementation: `closeRegion` in `src/lib/geometry/tracing.ts`; thresholds in
`DEFAULT_CLOSURE`.

## Consequences

- For straight edges, chord == boundary, so edge-to-edge cuts are exact and the mirrored
  copy stays attached. Corner-spanning or interior chords are rejected rather than
  producing wrong geometry.
- Clipping to black enforces "you can only cut black" and is robust to strokes that stray
  outside the shape.
- Snapping to hole boundaries is supported from the start; the plan's outer-boundary-only
  fallback was not needed.
- Closed interior cuts are allowed and produce detached reflections (see ADR 0013).

## Alternatives considered

- Arc extraction along the boundary with Paper `splitAt`: more general but more fragile;
  the chord check plus clipping covers the MVP cases.
- Storing closure parameters instead of the resolved region: rejected — see ADRs 0003/0011.
