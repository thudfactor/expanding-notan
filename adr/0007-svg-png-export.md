# 0007. SVG-intermediate export and PNG rasterization

- Status: Accepted
- Date: 2026-10-14

## Context

Users need both a vector (SVG) and a raster (PNG) export of the finished artwork. The two
must look identical, and PNG needs a chosen background and scale.

## Decision

- Export always covers the **full artboard** (`880 × 880`), including the margins.
- Build a fresh, dedicated Paper scope for export via `buildExportScene` — a white
  background (unless transparent), the black silhouette, and optional seam lines. The live
  preview/overlay is never included.
- **SVG** is produced with `project.exportSVG({ asString, matchColors, bounds })`.
- **PNG** is produced by rasterizing that *same* SVG: load it into an `Image`, draw it to an
  offscreen canvas at `scale`, then `canvas.toBlob('image/png')`. Because both formats share
  one geometry source, they match, and the background is baked in consistently.
- The export dialog exposes format, background (white/transparent), PNG scale (default 2x),
  and include-seams (default off).
- Filenames follow `notan-<format>-<yyyyMMdd-HHmmss>.<ext>`.

## Consequences

- One code path for both formats; no divergence between vector and raster output.
- Paper's `exportSVG` requires a DOM, so export runs in the browser only. Scene composition
  (`buildExportScene`) is Paper-only and unit-tested headless; the SVG/PNG step is verified
  end-to-end via the screenshot tooling (a real download).
- Seam inclusion defaults off, so the default export is a pure black-on-white silhouette.

## Alternatives considered

- Rasterizing the live canvas directly (`canvas.toDataURL`): ties output to display
  resolution, and can't honor transparent/white reliably.
- A separate drawing pipeline for PNG: risks divergence from the SVG.
