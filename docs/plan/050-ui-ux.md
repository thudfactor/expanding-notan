# 050 — UI / UX

## Layout

Use semantic HTML:

```
<body>
  <header>   <!-- Toolbar -->
    Undo · Redo · New project · Seam lines (toggle) · Export · Help
  </header>
  <main>     <!-- Canvas host (Paper.js) -->
    <canvas aria-label="Notan drawing area">…</canvas>
  </main>
  <!-- <dialog> elements: CommitBar (inline overlay), Export, Help, Confirm -->
</body>
```

- The canvas fills `main`; the artboard scales to fit with the square centered and the
  60% margin preserved visually.
- Commit actions appear as an overlay bar (not a modal) while a cut preview is active.

## Toolbar

- **Undo** / **Redo** buttons, disabled when unavailable, with keyboard shortcuts.
- **New project**: destructive; opens a confirm dialog.
- **Seam lines**: toggle for the construction-line layer.
- **Export**: opens the export dialog.
- **Help**: opens the help dialog.

## Drawing interaction

1. Pointer down on the canvas starts a freehand stroke; move records raw points
   (decimated by `minDistance`); the stroke renders live in the `preview` layer.
2. Pointer up: run the fitter, then attempt region closure:
   - Near-closed stroke → use the enclosed area.
   - Otherwise → project both endpoints onto the nearest silhouette edge, snap, and build
     the region from the stroke plus the boundary arc (choose the arc that yields a valid
     simple region). Show snap indicators on the `overlay` layer.
   - If no valid region can be formed, discard the stroke and show a brief hint.
3. On success, render the region as a preview and show the **CommitBar**:
   `Reflect Left · Reflect Right · Reflect Up · Reflect Down · Hole only · Cancel`.
4. Commit pushes one history entry and rebuilds the silhouette; Cancel discards.

## Commit bar behavior

- Reflect buttons apply the corresponding edge and commit.
- **Hole only** commits the subtract with no mirror.
- **Cancel** (and Esc) discards the preview.
- One action = one undo step.

## Dialogs

- **Help:** a `<dialog>` with a short explanation of the expanding-square Notan exercise
  and the tool's controls/rules. Authored by us in this iteration.
- **Export:** background (White / Transparent) and scale (default 2×), plus an
  "include seam lines" checkbox defaulting to off. See `060-export.md`.
- **Confirm (New project):** clearly states the current work will be destroyed.

## Keyboard

- `Cmd/Ctrl+Z` undo; `Shift+Cmd/Ctrl+Z` redo.
- `Esc` cancels an in-progress preview or closes a dialog.
- Buttons are reachable and labeled for screen readers.

## Accessibility & input

- Real `<button>` elements with accessible names; `<dialog>` for modals; focus management
  on open/close.
- Pointer events cover mouse, pen, and touch; `touch-action: none` on the canvas.
- Verify trackpad and touch drawing during the interaction milestone.
