# 0012. Playwright for screenshots and visual verification

- Status: Accepted
- Date: 2026-10-14

## Context

The app renders with Paper.js into a `<canvas>`, so its output cannot be verified by
builds, type-checking, or pure-unit tests alone. We want reproducible captures for review
during development and a foundation for automated visual checks.

## Decision

Use Playwright (the `playwright` dev dependency with Chromium) to drive a headless
browser. Add `scripts/screenshot.mjs`, run via `npm run shot`, which:

- starts Vite programmatically,
- loads the app headlessly and waits for the `body[data-notan-ready="true"]` marker,
- writes a PNG to `docs/screenshots/`, and
- runs a smoke check that the canvas center is dark (so a blank render fails loudly).

Screenshots are committed to the repository as a visual record per milestone. The
`data-notan-ready` marker exists only to make automation deterministic.

## Consequences

- Deterministic, reviewable screenshots for every UI milestone.
- A dev dependency plus browser binaries (~100 MB, cached outside the repo).
- Enables future visual-regression testing.
- A tiny production-irrelevant hook (`data-notan-ready`) lives in the canvas component.

## Alternatives considered

- Firefox headless CLI (`--screenshot`): zero install, but weaker control over timing and
  readiness; flakier for a canvas app.
- macOS `screencapture` / `osascript`: requires an interactive GUI session and Screen
  Recording permission; not suitable for headless automation.
