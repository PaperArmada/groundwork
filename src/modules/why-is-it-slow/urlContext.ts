// Module-local plumbing: lets components embedded in content.mdx read and
// write the module's deep-link state without prop-drilling through MDX.

import { createContext, useContext } from 'react';

export interface ModuleUrl {
  urlState: URLSearchParams;
  onStateChange: (s: URLSearchParams) => void;
}

export const ModuleUrlContext = createContext<ModuleUrl | null>(null);

export function useModuleUrl(): ModuleUrl {
  const ctx = useContext(ModuleUrlContext);
  if (!ctx) throw new Error('useModuleUrl outside module provider');
  return ctx;
}

export interface RaceParams {
  n: number;
  lat: 20 | 100 | 400;
  ops: number;
  labels: 'real' | 'human';
  seed: number;
}

export const RACE_DEFAULTS: RaceParams = {
  n: 50,
  lat: 100,
  ops: 1_000_000,
  labels: 'real',
  seed: 1,
};

export function readRaceParams(params: URLSearchParams): RaceParams {
  const num = (key: string, fallback: number, min: number, max: number) => {
    const raw = params.get(key);
    const v = raw === null ? NaN : Number(raw);
    return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
  };
  const latRaw = num('lat', RACE_DEFAULTS.lat, 20, 400);
  const lat = latRaw === 20 || latRaw === 400 ? latRaw : 100;
  return {
    n: num('n', RACE_DEFAULTS.n, 1, 5000),
    lat,
    ops: num('ops', RACE_DEFAULTS.ops, 10_000, 10_000_000),
    labels: params.get('labels') === 'human' ? 'human' : 'real',
    seed: num('seed', RACE_DEFAULTS.seed, 1, 2 ** 31),
  };
}

export function writeRaceParams(
  current: URLSearchParams,
  state: RaceParams,
): URLSearchParams {
  const params = new URLSearchParams(current);
  const setOrClear = (key: string, value: number | string, dflt: number | string) => {
    if (value === dflt) params.delete(key);
    else params.set(key, String(value));
  };
  setOrClear('n', state.n, RACE_DEFAULTS.n);
  setOrClear('lat', state.lat, RACE_DEFAULTS.lat);
  setOrClear('ops', state.ops, RACE_DEFAULTS.ops);
  setOrClear('labels', state.labels, RACE_DEFAULTS.labels);
  setOrClear('seed', state.seed, RACE_DEFAULTS.seed);
  return params;
}
