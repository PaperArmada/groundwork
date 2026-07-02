// THE registry (000 S2.2) — one typed entry per module. The shell derives
// catalog, search, and routing from this list. Fixtures are hidden: absent
// from catalog and search, reachable by URL, covered by the smoke harness.

import type { ModuleDef } from '../core/moduleDef.ts';

export const modules: ModuleDef[] = [
  {
    id: 'why-is-it-slow',
    title: 'Why is it slow?',
    blurb: 'A tiny loop, a six-second page. Learn to count trips first.',
    load: () => import('./why-is-it-slow/index.tsx'),
  },
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
    id: 'fixture-viz',
    title: 'Fixture: viz',
    blurb: 'Streaming histogram with percentile markers, plus the card.',
    load: () => import('./fixture-viz/index.tsx'),
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
