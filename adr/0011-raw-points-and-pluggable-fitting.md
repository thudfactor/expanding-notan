# 0011. Raw points canonical; pluggable stroke fitting

- Status: Accepted
- Date: 2026-10-14

## Context

Simplification and smoothing of a freehand stroke should be swappable later (curves versus
straight lines, amount of smoothing) without reworking the pipeline or losing the user's
input.

## Decision

- Capture stores the raw pointer points (decimated by `minDistance`) as the canonical
  input on each op (`rawPoints`).
- Fitting is a pure, replaceable transform behind a `StrokeFitter` registry
  (`src/lib/geometry/fit/`): `fit(points, options) -> Pt[]`. The MVP registers only
  `spline` (decimate → RDP simplify → smooth). Fitting has no Paper dependency and returns
  a polyline; a future strategy may emit curve segments.
- Each op stores its own `fit: { strategy, options }`; a project-level default seeds new
  strokes.
- At commit time the fitted stroke is closed into a **resolved region** (see ADR 0009), and
  that `region` is stored on the op so replay is deterministic and cheap. `rawPoints` and
  `fit` are retained so a future editor can re-fit and re-resolve.

## Consequences

- Non-destructive: input is never destroyed, so a later strategy change can re-fit.
- Replay is deterministic without re-running silhouette-dependent closure on every build.
- Storing `region` is a deliberate relaxation of the "never persist derived geometry" rule
  in ADR 0003: `region` is the committed piece boundary, authored by the user, not a cache.

## Alternatives considered

- Deriving the region from `rawPoints` on every replay: requires re-running
  silhouette-dependent closure during replay and re-snapping against intermediate
  silhouettes.
- Using Paper's `smooth()`: couples fitting to Paper and yields curves the model does not
  yet represent; deferred.
