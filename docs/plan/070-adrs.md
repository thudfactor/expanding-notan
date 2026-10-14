# 070 — Architecture Decision Records

Write ADRs in the repository's `adr/` directory as markdown, one file per decision, named
`NNNN-short-title.md` (e.g., `adr/0003-operation-log-artwork-model.md`). Create each ADR
when the corresponding decision is first implemented.

## Format

```md
# NNNN. <Title>

- Status: Accepted
- Date: <YYYY-MM-DD>
- Context: <the forces at play>
- Decision: <what we chose>
- Consequences: <tradeoffs, what this enables or constrains>
- Alternatives considered: <options rejected and why>
```

## Planned ADRs

| # | Title | Summary |
| --- | --- | --- |
| 0001 | Svelte 5 + Vite + TypeScript | Framework/build/language choice; runes for state |
| 0002 | Paper.js for geometry and export | Booleans, canvas rendering, SVG export |
| 0003 | Operation-log artwork model | Single ordered `CutOp[]` is source of truth; silhouette derived by replay |
| 0004 | Reflection semantics | Fixed square-edge axes; subtract-then-unite; order-dependent replay |
| 0005 | Snapshot-based history, persisted | Full-ops snapshots + index; survives reloads |
| 0006 | Persistence schema & versioning | Single project, `notan:v1:project`, versioned JSON, rebuild derived geometry |
| 0007 | SVG-intermediate export + PNG rasterization | One geometry source for both formats; background baked in |
| 0008 | Artboard units and the 60% margin rule | Logical units, `side=400`, margins `0.6×side`, unit-independent storage |
| 0009 | Cut validity and snap-to-any-artwork-edge | Closed or edge-to-edge; snap to outer boundary and hole boundaries |
| 0010 | Toggleable seam layer | Construction lines separated from silhouette; excluded from default export |
| 0011 | Raw points canonical; pluggable stroke fitting | Store raw input; simplify/smooth is a replaceable `StrokeFitter` strategy |
| 0012 | Playwright for screenshots and visual verification | Headless captures via `npm run shot`; committed under `docs/screenshots/` |
