# 040 — Data Model

## Core types

```ts
type Edge = 'left' | 'right' | 'top' | 'bottom';

interface Pt { x: number; y: number; }           // logical artboard units

interface FitOptions {
  minDistance: number;        // capture decimation (min gap between recorded points)
  simplifyTolerance: number;  // vertex reduction before fitting
  smoothing: number;          // spline smoothing amount
}

type FitStrategyId = 'spline'; // registry supports more later ('raw', 'polyline', ...)

interface CutOp {
  id: string;
  rawPoints: Pt[];                                    // canonical freehand input
  region: Pt[];                                       // resolved cut region (committed)
  fit: { strategy: FitStrategyId; options: FitOptions };
  reflect: Edge | null;                               // null = "Hole only"
}

interface ProjectState {
  version: 1;
  artboard: { side: number };                          // 400; margins derived (0.6×side)
  fitDefaults: FitOptions;
  ops: CutOp[];
  seamVisible: boolean;
  history: { states: CutOp[][]; index: number };
}
```

## Notes

- `rawPoints` is the canonical input; `region` is the resolved cut boundary (fitted then
  closed against the silhouette, then stored) so replay is deterministic (see ADRs
  0009/0011). `rawPoints` + `fit` are retained for future non-destructive re-fitting.
- Reflected-copy geometry is **not** stored; it is recomputed by replaying `ops`.
- `history.states` holds snapshots of `ops` only (settings are not part of undo).
- Keep `op.id` stable so previews, seams, and future per-op selection can reference ops.

## Local storage schema

Key: `notan:v1:project`

```jsonc
{
  "version": 1,
  "artboard": { "side": 400 },
  "fitDefaults": { "minDistance": 3, "simplifyTolerance": 2, "smoothing": 0.5 },
  "ops": [ /* CutOp[] */ ],
  "seamVisible": true,
  "history": { "states": [ /* CutOp[][] */ ], "index": 0 }
}
```

Serialization is JSON. On load, validate `version`; if unknown/newer, do not clobber —
surface a non-destructive message and start fresh in memory until the user chooses.

## Defaults

- `artboard.side = 400`
- `fitDefaults = { minDistance: 3, simplifyTolerance: 2, smoothing: 0.5 }`
- `seamVisible = true` (on screen); export defaults to seams **off**
