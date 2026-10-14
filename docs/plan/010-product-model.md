# 010 — Product Model

## Overview

The app presents a single black square centered on a white artboard. The user draws
freehand "cuts" in the artwork and reflects the cut pieces outward across the square's
edges to build up a Notan design. The user is responsible for following the rules of
Notan; the tool does not enforce them.

## Core operation

The entire artwork is **black shapes on a white artboard**. The single source of truth is
an ordered log of cut operations. The rendered silhouette is derived by replaying the log.

Committing a cut performs, in order:

1. `black = black − region`  → the cut leaves a white (negative-space) hole.
2. If reflecting: `black = black ∪ mirror(region, edge)` → a mirrored black copy is added
   outside the chosen square edge. If "Hole only" is chosen, this step is skipped.

Replay order matters: a later cut piece can fill an earlier hole. This matches the
physical exercise, where a piece is removed from where it was and flipped to a new
location.

## Reflection rules

- Reflection axes are **always the four original square edges** (left, right, top,
  bottom). This is a deliberate simplification: reflected pieces do not introduce new
  coordinate frames, so multi-level expansion stays a uniform boolean-replay rule.
- Reflected (outside) pieces can themselves be cut. Those cuts also mirror across one of
  the four original edges, which is how a piece is "reflected back into the square".
- One edge per action. Reflecting to several sides is several actions and therefore
  several undo steps.

## Cut validity

A cut is valid when it forms a closed region:

- **Closed shape:** the freehand stroke returns near its start; the enclosed area is the
  region.
- **Edge-to-edge:** the stroke starts and ends near an edge; the region is the area
  enclosed by the stroke plus the boundary arc between the two endpoints.

Endpoints snap to **any edge of the current black silhouette** — the outer boundary or
the boundary of any hole, including the outer edges of reflected pieces. Fully interior
closed shapes are allowed and reflectable; the mirrored copy may land detached from the
square.

## Seam lines

Thin construction lines showing where pieces meet are available as a toggle. They are a
view/export option, not part of the silhouette, and are excluded from the default export.

## Scope boundaries (MVP)

- Freehand drawing only — no line, rectangle, ellipse, or other shape tools.
- No moving or rotating of cut shapes independently.
- Single project; no project list or naming.
- Front-end only; no backend or sync.
- "New project" destroys the current work after confirmation.
- A help dialog explains the basic rules of Notan and the controls.
