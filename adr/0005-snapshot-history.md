# 0005. Snapshot-based history, persisted

- Status: Accepted
- Date: 2026-10-14

## Context

Every transformation must support multi-level undo. The operation log is small (raw points,
a resolved region, and metadata per cut), so history can be simple and robust rather than a
clever command/inverse scheme.

## Decision

History is a list of immutable snapshots of the operation log plus a cursor:
`{ states: CutOp[][], index }`.

- Committing a cut pushes `[...current, op]` and truncates any redo states.
- Undo/redo move the cursor; the artwork is always `states[index]`.
- Snapshots share unchanged `CutOp` objects — only the array is copied.
- Length is capped (`MAX_STATES = 100`, oldest pruned).

The pure reducer lives in `src/lib/state/history.ts` and is unit-tested; a thin runes store
(`project.svelte.ts`) wraps it for the UI. History will be persisted with the project (M6)
so undo survives reloads.

## Consequences

- Undo/redo are O(1) cursor moves; committing is a small array copy.
- A cap bounds memory and localStorage size.
- Settings (seam toggle, export options) are deliberately not part of history — only the
  operation log is.
- Persisting the full snapshot list trades a little storage for simple, correct undo. At
  our scale that is the right trade.

## Alternatives considered

- Command/inverse operations (undo by replaying inverses): more complex and error-prone with
  boolean geometry.
- Persisting only the current ops and recomputing history: cannot reliably traverse
  forward/back.
