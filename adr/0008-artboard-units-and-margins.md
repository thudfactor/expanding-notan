# 0008. Artboard units and the 60% margin rule

- Status: Accepted
- Date: 2026-10-14

## Context

The spec requires the black square to be centered with at least 60% of the square's width
as margin on every side. Geometry must be resolution-independent so it survives window
resizing, high-DPI displays, and export at arbitrary scale.

## Decision

Define a fixed logical artboard in abstract units:

- square side `S = 400`
- margin per side `0.6 * S = 240` (satisfies "at minimum 60%" exactly)
- artboard size `880 x 880`, with the square centered at `(440, 440)`

All stored geometry uses artboard units. The Paper.js view scales the artboard to fit the
available viewport, and export uses its own scale factor. Pointer input is converted to
artboard units before storage.

## Consequences

- The 60% margin holds at any window size by construction: it is a ratio within the
  artboard, independent of display scale.
- Persisted geometry never needs migration when display or export scale changes.
- A single `fitScale(viewportWidth, viewportHeight, padding)` helper drives display scaling
  and is unit-tested.

## Alternatives considered

- Storing pixel coordinates: breaks on resize/HiDPI and complicates export.
- Sizing the square relative to the viewport: makes stored geometry depend on the display
  and complicates export at a fixed size.
