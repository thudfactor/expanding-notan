# 020 — Tech Stack & Coordinate System

## Stack

| Concern | Choice |
| --- | --- |
| Build tool | Vite |
| UI framework | Svelte 5 (runes: `$state`, `$derived`, `$effect`) |
| Language | TypeScript |
| Geometry / rendering | Paper.js |
| Tests | Vitest |
| Input | Mouse + touch/pen via pointer input |

Semantic HTML wherever possible (`header`, `main`, `button`, `dialog`, `table`, etc.).
`touch-action: none` on the drawing surface to prevent scroll gestures during drawing.

## Coordinate system

Use fixed logical artboard units; scale for display and export separately.

- Square side: `S = 400`
- Margin per side: `0.6 × S = 240` (satisfies the "at minimum 60%" rule exactly)
- Artboard: `880 × 880`
- Square rect: `(240, 240)` → `(640, 640)`, i.e. centered at `(440, 440)`

The Paper.js view scales the 880-unit artboard to fit the available window area
(responsive). Pointer coordinates are converted to artboard units before storage so that
persisted geometry is resolution-independent.

Export uses its own scale factor (default 2×) independent of the display scale.

## Rendering model

- Paper.js `Project` with layers: `background` (white artboard rect), `silhouette` (black
  compound path), `preview` (in-progress stroke / region), `seams` (construction lines),
  `overlay` (snap guides).
- Boolean operations via Paper.js (`subtract`, `unite`) on the silhouette.
- SVG export via `project.exportSVG`; PNG produced by rasterizing the SVG (see `060-export.md`).
