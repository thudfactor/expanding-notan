# 080 — Milestones

Ordered, each independently verifiable. Do not start a milestone until the previous one's
acceptance criteria pass.

## M1 — Scaffold & static artboard

- Initialize Vite + Svelte 5 + TypeScript + Vitest; basic app shell with semantic layout.
- Render the artboard: white 880×880, centered black 400×400 square (240 margin/side),
  scaled to fit the window.
- ADRs: 0001, 0002, 0008.
- **Accept:** square is centered with exactly 60% margin per side at any window size.

## M2 — Geometry engine

- Pure-math core (mirror, projection, area/winding) + Paper adapter (`subtract`, `unite`).
- `buildSilhouette(ops)` replay; render black on white.
- Unit tests for mirror across all four edges and replay determinism.
- ADRs: 0003, 0004.
- **Accept:** a hand-built op list renders the expected silhouette; tests pass.

## M3 — Drawing, fitting & region closure (highest risk)

- Raw capture (decimation) → `StrokeFitter` registry (spline only) → region closure with
  snapping to any artwork edge.
- Near-close detection; snap indicators on the overlay layer; discard invalid strokes.
- Tests for the fitter registry, spline strategy, and endpoint projection.
- ADRs: 0009, 0011 (and 0003/0009 amended to note fitting sits between capture and closure).
- **Accept:** a freehand stroke either closes on itself or snaps to an edge and produces a
  valid region; spline fitting is swappable via the registry.

## M4 — Commit bar

- Preview state + overlay bar: Reflect L/R/U/D, Hole only, Cancel (and Esc).
- Wire each action to append a `CutOp` and rebuild.
- **Accept:** each commit action produces the correct hole/copy; cancel discards.

## M5 — History (undo/redo)

- Snapshot history with index; toolbar buttons + keyboard shortcuts; disabling states.
- ADR: 0005.
- **Accept:** multi-level undo/redo traverses every committed cut; settings are unaffected.

## M6 — Persistence

- Debounced autosave to `notan:v1:project`; load on startup; version check.
- New project + confirm dialog clears ops/history/storage.
- ADR: 0006.
- **Accept:** reload restores artwork *and* undo history; New project (confirmed) starts clean.

## M7 — Seam layer

- Compute construction lines from ops; toggle in the toolbar.
- ADR: 0010.
- **Accept:** toggle shows/hides seams without altering the silhouette.

## M8 — Export

- SVG export; PNG export by rasterizing SVG; dialog for background, scale, seams, format.
- ADR: 0007.
- **Accept:** PNG (white/transparent, at chosen scale) and SVG match the on-screen art and
  cover the full artboard.

## M9 — Help, a11y & input polish

- Help `<dialog>` with Notan rules + controls; semantic HTML review; focus management;
  touch/pen verification; `touch-action: none`.
- **Accept:** help dialog is informative and accessible; drawing works with mouse and touch.

## M10 — QA & docs

- Fill test gaps (serialization round-trip, history bounds, persistence migration path).
- README with setup/run/build/test instructions; confirm all ADRs exist.
- **Accept:** `npm test` and `npm run build` succeed; docs are current.
