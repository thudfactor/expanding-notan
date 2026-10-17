# 0014. Boundary-arc cut regions; reject self-intersecting strokes

- Status: Accepted
- Date: 2026-10-17
- Supersedes: 0009

## Context

ADR 0009 closed edge-to-edge cuts with a **straight chord** and validated it with
`chordFollowsBoundary` (every chord sample within `boundaryTolerance` of the boundary). That
was a deliberate simplification of the plan's model — `010-product-model.md` says the region
is "the area enclosed by the stroke plus the **boundary arc** between the two endpoints" — and
ADR 0009 named arc extraction as the deferred alternative.

Two problems surfaced in use:

1. **The magnet preview lies.** `updateDrawSnap` snaps the indicator to the *nearest* boundary
   point within the snap radius, regardless of whether the resulting cut will pass the chord
   guard. The affordance advertises cuts that are then rejected — "looks valid, then error."
2. **The distance test is stricter than the user's reading.** On irregular silhouettes,
   adjacent boundary segments can be nearly collinear, so a stroke that reads as "one edge"
   fails the chord test.

The product goal is to behave close to what scissors and paper allow, with a single exception:
a stroke may not intersect itself.

## Decision

- An edge-to-edge cut's region is the area enclosed by the stroke **plus the boundary arc
  between the two endpoints** (`Path#splitAt`), not a straight chord. This restores the plan's
  model.
- **Drop `chordFollowsBoundary`.** Any two resolved boundary endpoints define a closing arc.
- **Reject a stroke that intersects itself** (non-adjacent segments crossing). Scissors cannot
  cross their own just-cut line. Crossing a *previous* cut stays allowed — scissors can lift
  and re-enter.
- **Reject a non-simple candidate region** — a stroke that crosses its closing arc away from
  the endpoints (per `090-risks-and-assumptions.md`).
- A boundary-to-boundary stroke partitions the silhouette into two sub-regions, and both are
  now potentially valid. Resolve the ambiguity with an **explicit piece selection**, defaulting
  to the smaller-area piece.
- Endpoints on **different boundary components** (outer vs a hole) leave "the other arc"
  ill-defined; such cuts are slits and are rejected by `minArea` (fallback in risk 090).

The stored op schema is unchanged: an op stores the *chosen* resolved `region` (ADRs 0003 /
0011).

## Consequences

- The magnet preview becomes trustworthy: any snapped endpoint can form a committable cut.
- Corner cuts (adjacent edges) and near-flat irregular boundaries now match physical paper.
- Mirrored copies stay attached, because the closing edge is genuinely the boundary.
- New UI: a way to choose *which* piece is the cut piece (CommitBar gains a piece toggle, or
  click-to-pick on the canvas). Reflection axes the piece does not touch may be disabled or
  warned.
- A new validity rule (self-intersection) needs its own hint copy, distinct from
  "must close on itself or start and end on an edge."
- More Paper-dependent code (`splitAt` on compound paths, simplicity validation) and higher
  fragility; risk 090's mitigation and outer-boundary fallback apply.

## Alternatives considered

- **Keep the chord plus a tolerance** (ADR 0009 option A): cheap, but the region is still the
  lens between stroke and chord on curved boundaries, and the magnet still lies.
- **Remove the guard but keep the straight chord**: the region becomes the lens between the
  stroke and the chord, not the physical piece — worse than the arc.
- **Repair self-intersections with `resolveCrossings`** instead of rejecting: silently changes
  the shape the user drew; rejected for fidelity.
- **Auto-select the smaller piece only**: correct for edge bites, wrong for near-bisection
  cuts — which is the case that motivated an explicit choice.

## Implementation

`closeRegion` in `src/lib/geometry/tracing.ts`: arc closing via `Path#splitAt`, a
self-intersection guard, and a two-candidate result the UI selects between. Endpoints continue
to be resolved by `resolveEndpoints` (crossings, then snap). See ADRs 0009 / 0011 for the
retained parts of the closure pipeline.
