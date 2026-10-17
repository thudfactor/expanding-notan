# 0009. Cut validity and snap-to-any-artwork-edge

- Status: Superseded by ADR 0014 (boundary-arc cut regions)
- Date: 2026-10-14

## Context

A cut must define a 2D region before it can be subtracted and reflected. Users draw
freehand, so the tool must decide when a stroke is a valid cut and how it meets the
artwork boundary.

## Decision

A stroke is a valid cut when either:

- it closes on itself (start within `closeRadiusPx` of the end), or
- it produces two edge endpoints and the straight chord between them follows the boundary
  (sampled within `boundaryTolerance`).

Endpoints are resolved in two ways, preferring the first:

1. **Boundary crossings.** Where the stroke crosses the silhouette boundary, the first and
   last crossings become the endpoints. This handles **overshoot** — starting or ending the
   stroke past the edge — without needing the endpoint to sit within any radius.
2. **Distance snap.** If there are fewer than two crossings, endpoints snap to the nearest
   boundary point within `snapRadiusPx` (handles strokes that stop short of the edge).

Radii are specified in **CSS pixels** (`DEFAULT_CLOSURE_PX`: close 24px, snap 32px) and
converted to artboard units via the view scale (`closureOptionsFromScale`, using
`1 / view.zoom`), so the grab feel is constant across window sizes. While drawing, a magnet
indicator appears when the pointer is within the snap radius of the boundary.

Endpoints may land on **any** edge of the silhouette — the outer boundary or a hole
boundary, including reflected pieces. The resolved region is clipped to the current black
silhouette (`region = closedStroke ∩ silhouette`), so only black is cut. Regions smaller
than `minArea` are rejected, and invalid strokes are discarded with a hint.

Implementation: `closeRegion` in `src/lib/geometry/tracing.ts`; thresholds in
`DEFAULT_CLOSURE` / `DEFAULT_CLOSURE_PX`.

## Consequences

- Overshoot is forgiving (crossings), and stopping short is forgiving (snap radius),
  addressing the "tolerances too small" UX concern.
- For straight edges, chord == boundary, so edge-to-edge cuts are exact and the mirrored
  copy stays attached. The chord guard still rejects corner-spanning or interior chords
  rather than producing wrong geometry.
- Clipping to black enforces "you can only cut black" and is robust to strokes that stray
  outside the shape.
- Snapping to hole boundaries is supported from the start; the plan's outer-boundary-only
  fallback was not needed.
- Closed interior cuts are allowed and produce detached reflections (see ADR 0013).

## Alternatives considered

- Arc extraction along the boundary with Paper `splitAt`: more general but more fragile; the
  chord check plus clipping covers the MVP cases.
- Pixel radii only (no crossings): simpler, but overshoot beyond the radius would still be
  rejected.
- Storing closure parameters instead of the resolved region: rejected — see ADRs 0003/0011.
