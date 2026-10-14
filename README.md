# Notan — Expanding the Square

A web tool for making digital versions of the **"expanding the square"** Notan exercise.
Start with a black square, cut freehand shapes, and reflect the cut pieces outward across
the square's edges. Following the rules of Notan is the user's responsibility — the tool
does not enforce them.

- Front-end only (no backend); work in progress is saved to `localStorage`.
- Freehand drawing only; multi-level undo/redo; PNG and SVG export; toggleable seam lines.

## Tech stack

Vite · Svelte 5 (runes) · TypeScript · Paper.js · Vitest · Playwright (screenshots)

## Getting started

```sh
npm install
npm run dev
```

Then open the printed local URL and start drawing on the square.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests with Vitest |
| `npm run check` | Type-check Svelte components and TypeScript |
| `npm run shot -- <name> [w] [h] [interaction]` | Capture a screenshot into `docs/screenshots/` |

The screenshot script's optional `interaction` can be one of `draw`, `commit`, `undo`,
`reload`, `seams-off`, `export`, `help`, or `pen` to drive the app before capturing.

## How it works

- The artwork is a black silhouette on a white artboard. The single source of truth is an
  ordered log of cut operations (`CutOp[]`); the silhouette is derived by replaying it
  (`subtract` each cut region, `unite` its mirrored copy).
- Reflection axes are always the four original square edges.
- Cuts must close on themselves or start and end on an edge of the current silhouette.
- Simplify/smooth is a pluggable `StrokeFitter` strategy; raw points are canonical.

See the plan and ADRs below for the full rationale.

## Documentation

- `docs/project_spec.md` — the original project spec
- `docs/plan/` — the implementation plan (index plus per-topic sections)
- `adr/` — architecture decision records
- `docs/ux-concerns.md` — running list of UX issues to address later
- `docs/screenshots/` — committed visual record, one capture per milestone

## Deployment (GitHub Pages)

The app is deployed to GitHub Pages by `.github/workflows/deploy.yml`, which builds and
publishes `dist/` on every push to `main`. Because it is a project page served from a
subpath, the workflow builds with `BASE_PATH=/expanding-notan/` so assets resolve correctly;
local dev uses the root base.

One-time setup: in **Settings → Pages**, set the source to **GitHub Actions**.

## Links

- Repository: https://github.com/thudfactor/expanding-notan
- Bugs / suggestions: https://github.com/thudfactor/expanding-notan/issues
