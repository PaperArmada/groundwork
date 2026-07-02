// Pure param codec for fixture-shell's deep-link round trip (000 S2.5, S3).

export const SHAPES = ['circle', 'square', 'triangle'] as const;
export type Shape = (typeof SHAPES)[number];

export interface ShellParams {
  shape: Shape;
  count: number;
}

export const DEFAULTS: ShellParams = { shape: 'circle', count: 3 };
export const COUNT_MIN = 1;
export const COUNT_MAX = 10;

export function readParams(params: URLSearchParams): ShellParams {
  const rawShape = params.get('shape');
  const shape = (SHAPES as readonly string[]).includes(rawShape ?? '')
    ? (rawShape as Shape)
    : DEFAULTS.shape;
  const rawCount = params.get('count');
  const parsed = rawCount === null ? NaN : Number(rawCount);
  const count = Number.isInteger(parsed)
    ? Math.min(COUNT_MAX, Math.max(COUNT_MIN, parsed))
    : DEFAULTS.count;
  return { shape, count };
}

export function writeParams(state: ShellParams): URLSearchParams {
  const params = new URLSearchParams();
  if (state.shape !== DEFAULTS.shape) params.set('shape', state.shape);
  if (state.count !== DEFAULTS.count) params.set('count', String(state.count));
  return params;
}
