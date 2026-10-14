# Notan "Expanding the Square" — Implementation Plan

**Status:** Approved for implementation (MVP)
**Spec source:** `docs/project_spec.md`
**Tech:** Vite + Svelte 5 + TypeScript + Paper.js, Vitest for tests

## Purpose

A front-end-only web tool for making digital versions of the "expanding the square"
Notan exercise: start with a black square, cut freehand shapes, and reflect the cut
pieces outward across the square's edges. Multi-level undo, autosave to localStorage,
and PNG/SVG export.

## How to use this plan

Read the index, then open the section relevant to the milestone you are working on.
Each section is self-contained. Architectural decisions are recorded as ADRs (see
`070-adrs.md`); create the ADR file in the repo's `adr/` directory when the decision is
first implemented.

## Sections

| File | Contents |
| --- | --- |
| `010-product-model.md` | What the tool does, the cut/reflection model, resolved decisions |
| `020-tech-stack.md` | Stack, versions, coordinate system, artboard geometry |
| `030-architecture.md` | Modules, geometry engine, pluggable stroke fitting, state, history, persistence |
| `040-data-model.md` | TypeScript types, op schema, localStorage schema, versioning |
| `050-ui-ux.md` | Layout, toolbar, canvas interactions, dialogs, keyboard, a11y, touch |
| `060-export.md` | SVG and PNG export, options, seam handling |
| `070-adrs.md` | ADR list, format, and location |
| `080-milestones.md` | Ordered milestones with acceptance criteria |
| `090-risks-and-assumptions.md` | Risks/mitigations and standing assumptions |

## Decision summary

| # | Decision | Choice |
| --- | --- | --- |
| 1 | Cut result | Cut region becomes a white hole; a mirrored black copy appears outside the chosen edge |
| 2 | Reflection axis (nested cuts) | Always one of the four original square edges |
| 3 | Direction selection | Explicit buttons, one edge per action (multiple sides = multiple undo steps) |
| 4 | Closed interior shapes | Allowed and reflectable (may land detached) |
| 5 | Draw + commit flow | Auto-snap endpoints to any artwork edge, auto-close, preview, then Reflect/Hole only/Cancel |
| 6 | Fit settings in data model | Per-stroke fit + project-level default (UI deferred) |
| 7 | MVP fit strategies | Spline only, behind a pluggable `StrokeFitter` registry |
| 8 | Raw input | Raw points are canonical; fitting is a replaceable pure transform |
| 9 | Export area | Full artboard including margins |
| 10 | PNG options | Dialog asks background (white/transparent) and scale |
| 11 | Seam lines | Subtle construction lines, toggleable, off by default in export |
| 12 | Undo | Multi-level, snapshot-based, persisted with the project |
| 13 | Persistence | Single project, key `notan:v1:project`, autosave |
| 14 | New project | Destructive, requires confirmation |
| 15 | Stack | TypeScript, Svelte 5 (runes), pointer/touch input, Vitest |
