# 0002. Paper.js for geometry and export

- Status: Accepted
- Date: 2026-10-14

## Context

The core of the tool is boolean geometry — subtracting cut regions from the silhouette
and unioning mirrored copies — plus vector export. Implementing robust polygon booleans
by hand is error-prone and time-consuming.

## Decision

Use Paper.js for boolean path operations (`subtract`, `unite`, `resolveCrossings`),
canvas rendering, and SVG export. Keep Paper-specific code isolated behind a thin adapter
(`src/lib/paper/` and `src/lib/geometry/engine.ts`) so the pure math stays framework-free
and unit-testable in Node.

## Consequences

- Robust booleans and SVG export come out of the box.
- A hard dependency on Paper.js; the math core must avoid importing it to remain testable.
- Paper.js exposes a canvas-oriented API, so coordinate and scale handling is centralised
  in one place.

## Alternatives considered

- Hand-rolled polygon clipping: too risky for an MVP.
- SVG.js / Two.js: weaker boolean and path utilities.
- Canvas 2D only: no vector export.
