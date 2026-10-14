# 0003. Operation-log artwork model

- Status: Accepted
- Date: 2026-10-14

## Context

The artwork is a black silhouette on a white artboard built up by cutting and reflecting
pieces. It needs a representation that supports multi-level undo, persistence, and future
editing (moving or rotating cuts).

## Decision

The single source of truth is an ordered list of cut operations (`CutOp[]`). Each op holds
its raw freehand points, its fitting settings, and the reflection edge (or `null`). The
rendered silhouette is derived by replaying the log: start from the square, `subtract`
each op's region, and when reflecting `unite` the region mirrored across the chosen square
edge. Derived geometry is never persisted — only the op log is.

Replay is implemented by `buildSilhouette` in `src/lib/geometry/engine.ts`, using a Paper
scope. The pure math (mirror, area, projection) lives in `src/lib/geometry/math.ts` with no
Paper dependency.

## Consequences

- Undo/redo and persistence operate on small, simple data (snapshots of the op log).
- Order is preserved and matters, matching the physical "remove, then flip" process.
- Fitting or reflection rules can change later and geometry re-derives with no data loss.
- Boolean replay cost grows with the number of ops; acceptable at this scale.

## Alternatives considered

- Persisting baked path geometry: larger, order-lossy, hard to re-derive or un-edit.
- A scene graph of independent pieces: complicates holes and overlapping regions.
