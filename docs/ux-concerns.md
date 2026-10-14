# UX Concerns

A running list of user-experience issues to address in later iterations. Add new entries
at the top of the table and (optionally) a detail section below. Mark an item `Done` with
the milestone or commit that resolved it.

| # | Status | Area | Concern | Raised |
| --- | --- | --- | --- | --- |
| 1 | Open | Commit bar | Reflection button labels are confusing when reflecting an expanded cut | 2026-10-14 |

## 1. Reflection button labels are confusing when reflecting an expanded cut

- **Status:** Open
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
