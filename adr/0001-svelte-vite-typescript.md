# 0001. Svelte 5 + Vite + TypeScript

- Status: Accepted
- Date: 2026-10-14

## Context

The project is a new, front-end-only interactive drawing tool. We want a fast dev loop,
a component model suited to a canvas-plus-toolbar UI, and type safety across the geometry
engine and application state.

## Decision

Use Vite as the build tool and dev server, Svelte 5 (runes: `$state`, `$derived`,
`$effect`) for the UI, and TypeScript throughout.

## Consequences

- Vite provides fast HMR and a simple production build.
- Svelte 5 runes give explicit, fine-grained reactive state without a separate store
  library.
- TypeScript catches errors in the geometry/data-model layer, which is the most intricate
  part of the app.
- `svelte-check` currently supports TypeScript `^5 || ^6`, so we pin the TypeScript 5.x
  line rather than the newer major.

## Alternatives considered

- React or Vue: heavier runtime and less ergonomic for a small canvas tool; Svelte was
  requested in the spec.
- Plain JavaScript: rejected — the geometry engine benefits substantially from types.
