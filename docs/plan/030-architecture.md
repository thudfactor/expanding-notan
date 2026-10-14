# 030 — Architecture

## Module layout

```
src/
  App.svelte
  main.ts
  app.css
  lib/
    geometry/
      types.ts          # Pt, Edge, CutOp, FitOptions, ProjectState
      artboard.ts       # constants, unit helpers, fit-to-window scaling
      fit/
        registry.ts     # StrokeFitter interface + strategy registry
        spline.ts       # MVP strategy (Paper smoothing)
      tracing.ts        # raw capture -> fit -> region closure + edge snapping
      engine.ts         # replay ops -> silhouette; mirror; seams
      serialize.ts      # op/project (de)serialization, versioning
    state/
      project.svelte.ts # runes state: ops, fitDefaults, seamVisible; autosave
      history.svelte.ts # snapshot undo/redo
    export/
      exportSvg.ts
      exportPng.ts
    components/
      Toolbar.svelte
      Canvas.svelte     # Paper.js host; pointer handling
      CommitBar.svelte  # Reflect L/R/U/D, Hole only, Cancel
      ExportDialog.svelte
      HelpDialog.svelte
      ConfirmDialog.svelte
    paper/
      paperSetup.ts
adr/
  0001-....md
docs/project_spec.md
```

## Geometry engine

- **Pure-math core** (points, mirror across an edge, winding/area, projection onto an
  edge) has no Paper.js dependency so it is unit-testable in Node.
- **Thin Paper adapter** wraps boolean ops (`subtract`, `unite`, `resolveCrossings`) and
  rendering. Keep Paper-specific code isolated here.
- `buildSilhouette(ops)` replays the log from the initial square:
  `for op of ops: subtract(op.region); if op.reflect: unite(mirror(op.region, edge))`.
- Region geometry is the resolved, committed cut boundary (`op.region`); `rawPoints` + `fit`
  are retained so a future editor can re-fit and re-resolve non-destructively (ADR 0011).

## Pluggable stroke fitting

Design simplify/smooth for **future expansion** (user choice of curves vs straight lines,
amount of smoothing), without reworking the pipeline.

Capture and fit are separate stages:

1. **Capture:** record raw pointer points, decimated by `minDistance`.
2. **Fit:** apply a `StrokeFitter` strategy to produce geometry usable for region closure.

```ts
interface StrokeFitter {
  id: string;                 // "raw" | "polyline" | "spline" | future...
  label: string;
  defaults: FitOptions;
  fit(points: Pt[], opts: FitOptions): Pt[];   // fitted vertices / curve input
}
```

- Registry maps `id -> StrokeFitter`. MVP registers only the **spline** fitter.
- `FitOptions = { minDistance, simplifyTolerance, smoothing }`.
- Each `CutOp` stores its own `fit: { strategy, options }`; `project.fitDefaults` seeds new
  strokes. UI for choosing the strategy is deferred, but the data model already carries it.
- Fitting is a pure transform applied at build time. Because booleans are derived, a
  future strategy change can re-fit existing strokes **non-destructively** from `rawPoints`.

## State management

- Svelte 5 runes in `project.svelte.ts`: `$state` for `ops`, `fitDefaults`, `seamVisible`,
  transient drawing/preview state.
- Derived values (`$derived`): the silhouette build, polygon counts, undo/redo
  availability, etc.
- `$effect` triggers debounced autosave (~500 ms) whenever persisted state changes.

## History (undo/redo)

- Snapshot model: `history = { states: CutOp[][], index: number }`. Each committed cut
  pushes the new ops array. Snapshot is cheap because ops are small (raw points + metadata).
- Undo decrements `index`; redo increments it. Cap history length (~100) and prune oldest.
- History is **persisted** with the project (per decision), so undo survives reloads.
- `seamVisible`, fit defaults, and export dialog choices are **not** undoable steps.
- Keyboard: Cmd/Ctrl+Z undo, Shift+Cmd/Ctrl+Z redo; mirrored by toolbar buttons.

## Persistence

- Single project in `localStorage` under key `notan:v1:project`.
- Debounced autosave; load on startup if present.
- Store raw data only (raw points, op metadata, history, settings). Rebuild derived
  geometry on load.
- Schema version field enables future migration.
- "New project" clears ops, history, and the storage key after confirmation.
