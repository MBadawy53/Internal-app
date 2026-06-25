/**
 * Public surface of the data-access layer.
 *
 * The UI imports everything it needs from here, so swapping the data source is
 * a one-line change in this file.
 */
export * from './types';
export { STAGE, chainFor, nextStage, transitionLabel, mkAudit } from './domain';
export { store } from './store';
export type { FactoringApi } from './http';

import { mockApi } from './mock';
// import { httpApi } from './http';

/**
 * 🔌 The single switch between mock data and the real back end.
 * Today: in-memory mock. To go live, replace with `httpApi` (and `await` the
 * call sites flagged "🔌 SWAP" in src/lib/portal/engine.js).
 */
export const api = mockApi;
// export const api = httpApi;
