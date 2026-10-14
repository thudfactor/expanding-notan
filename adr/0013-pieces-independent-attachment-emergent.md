# 0013. Pieces are independent; attachment is emergent; placement is derived

- Status: Accepted
- Date: 2026-10-14

## Context

When a cut is reflected, the mirrored copy may visually touch the square (an edge-to-edge
cut) or float free (an interior closed cut). We considered whether the model should record
whether a piece is "attached" to the square — especially anticipating a future feature that
adds paper-like "noise" to placement, mirroring the physical cut-flip-glue exercise.

## Decision

- The document model never stores an attachment relationship. Attachment is an emergent
  geometric property of the boolean union in `buildSilhouette`.
- A cut op stores its region (via `rawPoints` + fitting) and a reflection axis. The mirrored
  copy is *derived* exactly by mirroring across that axis; placement is a pure function of
  `(region, reflect)` for the MVP.
- Future noise and manual move/rotate will be an optional, authored per-op placement
  override (translate/rotate) keyed by the existing `op.id`, defaulting to the exact mirror.
  The primitive to add later is *piece identity + transform*, not attachment.
- When independent placement lands, rendering may migrate from union-everything replay to
  drawing the square, holes, and each piece as separate filled paths.

## Consequences

- No speculative `attached` state that could drift from geometry. Under noise, "is it
  attached?" is answered by pixels, not by a stored flag (which would need a tolerance).
- Undo and persistence stay small: region + axis (+ future transform).
- The tool stays deterministic today while leaving a clean path to independent, noisy
  placement later.

## Alternatives considered

- Storing `attached: boolean`: rejected — nothing consumes it, and it becomes incoherent
  under noise.
- Full independent piece entities now: deferred (YAGNI); the derived model is simpler, and
  the op log already keys pieces by their `id`.
