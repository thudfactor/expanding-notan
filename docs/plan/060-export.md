# 060 — Export (SVG & PNG)

## Export area

Always the **full artboard** (`880 × 880` logical units), including the 60% margins,
matching what is on screen.

## SVG

- Produce vector output via Paper.js: `project.exportSVG({ asString: true, bounds, matchColors: true })`.
- Export the silhouette (and background if the user chose one). Exclude the `preview` and
  `overlay` layers always; include the `seams` layer only if the user enables it.
- Units: logical artboard; set an explicit `viewBox` so the file scales cleanly.

## PNG

- Produce by rasterizing the SVG: serialize SVG → load into an `Image` → draw to an
  offscreen `<canvas>` at the chosen scale → `canvas.toBlob('image/png')`.
- This keeps PNG and SVG visually identical and honors the chosen background, because the
  background is baked into the SVG before rasterizing.
- Respect the chosen scale (default 2×). Optionally account for device pixel ratio for
  crisp on-screen previews, but export size is determined by `scale`.

## Export dialog options

| Option | Values | Default |
| --- | --- | --- |
| Background | White / Transparent | White |
| Scale | 1×, 2×, 3× (or custom) | 2× |
| Include seam lines | on / off | off |
| Format | PNG / SVG | PNG |

- Filename pattern: `notan-<format>-<yyyyMMdd-HHmmss>.<ext>`.
- The dialog applies to a single export action; choices are not persisted as undo steps.
