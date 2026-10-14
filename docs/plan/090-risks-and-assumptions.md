# 090 — Risks & Assumptions

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Silhouette snapping / region closure on contours with holes | Blocks M3; hard to get right | Dedicated spike first (M3). Snap to outer boundary + hole boundaries; use Paper `splitAt` to take the correct arc. Fallback: restrict snapping to the outer silhouette boundary if hole-edge arcs prove unstable. |
| Paper.js boolean robustness on self-intersecting freehand strokes | Wrong or broken silhouettes | `simplify` + `resolveCrossings` before boolean ops; validate region simplicity; discard invalid strokes with a hint. |
| Touch/pen drawing | Input unusable on tablets | Use pointer events + Paper touch; `touch-action: none`; verify in M9. |
| Persisted history growth | localStorage bloat | Cap history (~100 states) and prune oldest; ops are small (raw points only). |
| SVG→PNG raster sizing / DPR | Fuzzy or oversized PNGs | Rasterize at explicit `scale`; set SVG `viewBox`; verify against on-screen art. |
| Local storage quota / corrupt data | Lost work or crash on load | Try/catch parse; validate schema/version; never clobber unknown newer versions. |
| Re-fit changing past art (future feature) | Unexpected visual change | Raw points retained; fit settings stored per op so existing strokes can be frozen. |

## Standing assumptions

- One undo step per committed cut; seam toggle and export settings are not undoable.
- The artboard rescales responsively to the window; storage stays in logical units.
- PNG export defaults to 2× and a white background; seams default off in export.
- Help-dialog Notan copy is authored by us (brief rules + controls).
- Single project; no multi-project, no move/rotate, freehand only — per the spec.
- `seamVisible` defaults to on for the screen, off for export.
- Reflection/geometry decisions per `000-index.md` decision summary.
