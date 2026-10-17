# UX Concerns

A running list of user-experience issues to address in later iterations. Add each new entry
to the table with the next number and a matching detail section. Mark an item `Done` with
the milestone or commit that resolved it.

| # | Status | Area | Concern | Raised |
| --- | --- | --- | --- | --- |
| 1 | Done | Commit bar | Reflection button labels are confusing when reflecting an expanded cut | 2026-10-14 |
| 2 | Done | Drawing | Tolerances for recognizing start/stop points on an edge are too small | 2026-10-14 |
| 3 | Open | Seams | Seam lines are barely visible for simple cuts | 2026-10-14 |
| 4 | Done | Onboarding | New users don't know what they are expected to do | 2026-10-14 |
| 5 | Open | Reflection | Reflecting an interior (edge-less) piece across an axis detaches it; the axis buttons don't say so | 2026-10-17 |

## 1. Reflection button labels are confusing when reflecting an expanded cut

- **Status:** Done — labels now read "Reflect across … Left/Right/Top/Bottom edge"; hovering
  highlights the target edge and previews the mirrored placement at 50% opacity
- **Area:** Commit bar
- **Raised:** 2026-10-14

The commit bar offers "Reflect left / right / up / down". These directions refer to the four
edges of the **original square** (see ADR 0004), but when the user is cutting an
already-reflected (expanded) piece the labels are ambiguous — "left" reads naturally as the
*piece's* left, not the square's left edge.

Options to consider later:

- Rename to make the axis explicit (e.g. "Mirror across square's left edge").
- Preview the target axis on the canvas (e.g. highlight the edge the copy will flip across).
- Show the resulting placement before committing.

Note: this is a labeling/affordance problem, not a behaviour change — the reflection axis
stays one of the four original square edges.

## 2. Tolerances for recognizing start/stop points on an edge are too small

- **Status:** Done — screen-relative radii (32px snap / 24px close), boundary-crossing
  endpoints for overshoot, and a live magnet indicator
- **Area:** Drawing / cut recognition
- **Raised:** 2026-10-14

Users struggle to make a cut register: the stroke's start and end must land very close to an
edge (or to its own start) to be accepted. Strokes that visually touch the edge get rejected
with "A cut must close on itself or start and end on an edge."

Current thresholds (`DEFAULT_CLOSURE` in `src/lib/geometry/tracing.ts`, in artboard units):

- `closeThreshold: 14` — max start→end distance to treat a stroke as closed on itself
- `snapThreshold: 20` — max endpoint distance to an edge for snapping
- `boundaryTolerance: 1.5` — max distance a closing-chord sample may sit from the boundary

These feel too tight for hand and stylus drawing. Options to consider later:

- Raise the thresholds and tune them against real use.
- Make them proportional to the artboard or view zoom rather than absolute.
- Add stronger feedback: a magnet cursor and a highlighted edge when an endpoint is within
  snapping range, so users can see that they will connect.
- Optionally "snap on release": extend the stroke to the nearest edge if it ends close.

Note: this is a usability-threshold issue, not a change to cut validity rules (ADR 0009).

## 3. Seam lines are barely visible for simple cuts

- **Status:** Open
- **Area:** Seams / canvas
- **Raised:** 2026-10-14

Seam lines (the outlines of each cut region and its mirror, ADR 0010) sit exactly on the
black/white boundary for a flush edge-to-edge cut, so they read as a faint gray tint rather
than a legible construction line. They are more pronounced for overlapping/multi-level cuts.

Options to consider later:

- Increase contrast (darker or colored) or thickness; try dashed lines.
- Draw seams inset into the black so they are always over a solid color.
- Render seams only where they are strictly interior to black (skip boundary-coincident
  segments), so the layer only shows genuinely new information.
- Give each piece/mirror a subtly different seam tone to aid reading the construction.

Note: purely a rendering/legibility concern; the seam layer is already separate from the
silhouette and never alters the artwork.

## 4. New users don't know what they are expected to do

- **Status:** Done — Help auto-opens when there is no saved project (simplest version)
- **Area:** Onboarding
- **Raised:** 2026-10-14

On a first visit the app shows just a black square with no guidance, so a new user may not
realise they should draw a freehand cut and then reflect it.

**Proposed (simplest) answer:** if there is no saved project, auto-open the Help dialog on
load.

Notes / things to get right:

- "No saved project" means `parseSnapshot(readRaw())` returns `null` at startup.
- The save is only written on the first mutation, so a user who opens the app, reads Help,
  and leaves without drawing still has no saved data — Help would appear again next time.
  That may be acceptable, or a separate one-time "help seen" flag could suppress repeats.
- Only auto-open on first load; never when a saved project exists.
- The Help dialog already covers the rules and controls (M9), so no new content is needed.
- Consider pairing with a subtle on-canvas hint ("Drag to cut") for extra clarity.

## 5. Detached reflections aren't signalled on the axis buttons

- **Status:** Open
- **Area:** Reflection / CommitBar
- **Raised:** 2026-10-17

A closed interior cut (a shape that touches no square edge) is reflectable, and its
mirrored copy lands **detached** from the square (ADR 0013; plan `010`). The hover preview
shows where the copy lands, but the Reflect buttons themselves don't indicate that the
result will be detached — a user may expect the piece to stay attached.

Options to consider later:

- Label the axis (or its hover) as "detached" when the mirror won't touch the square, e.g. a
  subtitle or a dashed outline.
- Add a small "detached" badge to the placement preview.

Note: this is an **affordance**, not a restriction. Interior cuts must remain flippable, so
these axes are never disabled. The only axes currently disabled are those that would place
the mirror entirely off the artboard (`disabledEdges`) — a visibility guard, not an
attachment rule.
