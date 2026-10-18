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
  between the two endpoints**, not a straight chord. This restores the plan's model.
- **Drop `chordFollowsBoundary`.** Any two resolved boundary endpoints define a closing arc.
- **Reject a stroke that intersects itself** (non-adjacent segments crossing). Scissors cannot
  cross their own just-cut line. Crossing a *previous* cut stays allowed — scissors can lift
  and re-enter.
- **Evaluate that rule on the fitted stroke, but never let fitting introduce a crossing.** The
  fitter (RDP + smoothing) can change topology; if the requested fit self-intersects while the
  raw stroke does not, fall back to a less aggressive fit (dropping smoothing, then
  simplification, then decimation, then the raw stroke itself) until the fit is simple. Jitter
  that fitting cleans up is accepted; genuine crossings survive. The effective options are
  stored on the op (ADR 0011).
- **Reject a non-simple candidate region** — a stroke that crosses its closing arc away from
  the endpoints (per `090-risks-and-assumptions.md`).
- **Reject a region that covers the whole silhouette.** A stroke drawn outside the shape can
  otherwise be closed the long way around the boundary and enclose the entire silhouette;
  that region is not a piece. Subtracting it would erase the artwork, and reflecting it would
  flip the whole square across the edge.
- A boundary-to-boundary stroke partitions the silhouette into two sub-regions, and both are
  now potentially valid. Resolve the ambiguity with an **explicit piece selection**, defaulting
  to the smaller-area piece.
- Endpoints on **different boundary components** (outer vs a hole) leave "the other arc"
  ill-defined; such cuts are slits and are rejected (no single contour holds both endpoints).

The stored op schema is unchanged: an op stores the *chosen* resolved `region` (ADRs 0003 /
0011).

## Consequences

- The magnet preview becomes trustworthy: any snapped endpoint can form a committable cut.
- Corner cuts (adjacent edges) and near-flat irregular boundaries now match physical paper.
- Mirrored copies stay attached, because the closing edge is genuinely the boundary.
- New UI: a way to choose *which* piece is the cut piece (CommitBar gains a piece toggle, or
  click-to-pick on the canvas). Axes the piece does not touch are **not** disabled — interior
  cuts must stay flippable (ADR 0013); the UI may instead signal a detached result (UX #5).
- A new validity rule (self-intersection) needs its own hint copy, distinct from
  "must close on itself or start and end on an edge."
- More boundary-walking code (arc sampling per contour, simplicity validation) and higher
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

`closeRegion` in `src/lib/geometry/tracing.ts`: arc closing, a self-intersection guard, and a
two-candidate result the UI selects between. Endpoints continue to be resolved by
`resolveEndpoints` (crossings, then snap). See ADRs 0009 / 0011 for the retained parts of the
closure pipeline.

**Arc extraction: sampling, not `splitAt`.** The boundary arc is sampled per contour
(`sampleArc`, `ARC_STEP = 2` artboard units) rather than cut with `Path#splitAt`. Sampling is
simpler and robust on compound silhouettes, and its error is self-correcting: the candidate
polygon is re-intersected with the true silhouette, so the sampled arc's chord-chain is snapped
back to the boundary and the shave is sub-unit. `splitAt` (real curves) remains the alternative
if boundary fidelity ever needs to be exact.

**Topology-preserving fit.** `fitPreservingTopology` in `src/lib/geometry/fit/topology.ts`
wraps the fitter: it takes a `crosses` predicate (injected, so the module stays Paper-free) and
walks an aggressiveness ladder down to the raw stroke until the fit is simple. `Canvas` uses it
and stores the effective `fit.options` on the committed op.
