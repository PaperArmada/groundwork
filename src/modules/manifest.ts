// THE registry (000 S2.2) — one typed entry per module. The shell derives
// catalog, search, and routing from this list. Fixtures are hidden: absent
// from catalog and search, reachable by URL, covered by the smoke harness.

import type { ModuleDef } from '../core/moduleDef.ts';

export const modules: ModuleDef[] = [
  {
    id: 'fixture-transport',
    title: 'Fixture: transport',
    blurb: 'FramePlayer + TransportBar proving play/pause/step/seek/speed.',
    load: () => import('./fixture-transport/index.tsx'),
    hidden: true,
  },
  {
    id: 'fixture-predict',
    title: 'Fixture: predict',
    blurb: 'All four Predict kinds writing to the calibration ledger.',
    load: () => import('./fixture-predict/index.tsx'),
    hidden: true,
  },
  {
    id: 'fixture-shell',
    title: 'Fixture: shell',
    blurb: 'Theme, deep-link round trip, and reduced-motion checks.',
    load: () => import('./fixture-shell/index.tsx'),
    hidden: true,
  },
];
