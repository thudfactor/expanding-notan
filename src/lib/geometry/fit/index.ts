import { registerFitter } from './registry';
import { splineFitter } from './spline';

// Register the built-in fitters. Additional strategies can call registerFitter.
registerFitter(splineFitter);

export { decimate } from './decimate';
export { getFitter, listFitters, registerFitter } from './registry';
export { simplifyPoints } from './simplify';
export { smoothPoints } from './smooth';
export type { StrokeFitter } from './registry';
