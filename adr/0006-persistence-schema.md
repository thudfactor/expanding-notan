# 0006. Persistence schema and versioning

- Status: Accepted
- Date: 2026-10-14

## Context

The single work-in-progress must survive reloads, including undo history. The app is
front-end only, so storage is `localStorage`.

## Decision

- Single key: `notan:v1:project`.
- Persist `{ version, artboard, fitDefaults, seamVisible, history }`. The history is the
  source of truth for the op log; there is deliberately **no separate `ops` field** that
  could drift out of sync with it.
- Autosave is debounced (~400 ms) and triggered by mutations (`addCut`/`undo`/`redo`).
  "New project" clears the key immediately.
- On load, parse and validate the shape and `version`. Missing, malformed, or
  unknown/newer-version data is ignored — the app starts fresh in memory and does **not**
  clobber the stored value.
- Only the operation log carries undo; settings are stored for convenience but are not
  undoable.

Implementation: `src/lib/state/persistence.ts` (pure serialize/parse + guarded storage
access) wired into `project.svelte.ts`.

## Consequences

- Reload restores the artwork *and* the full undo/redo history.
- Schema validation prevents crashes from corrupt or foreign data.
- Storage size is bounded by the 100-state history cap.
- A future schema change is a version bump plus an upgrade path.

## Alternatives considered

- IndexedDB: unnecessary for a single small document.
- Persisting only `ops`: loses the redo/undo cursor.
- Persisting derived silhouette geometry: redundant and order-lossy.
