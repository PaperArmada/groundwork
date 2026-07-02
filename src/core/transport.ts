// Transport contract — normative in specs/000 S2.3. Two implementations:
// FramePlayer (this spec) and SimLoop (spec 001). The shared <TransportBar>
// renders from `capabilities`, so unsupported controls never appear.

export type TransportState = 'idle' | 'playing' | 'paused' | 'done';

export interface TransportCapabilities {
  stepBack: boolean;
  seek: boolean;
}

export interface Transport {
  play(): void;
  pause(): void;
  toggle(): void;
  stepForward(): void;
  stepBack(): void; // capability-gated
  /** pos is normalized progress in [0, 1] (000 §11 resolution). */
  seek(pos: number): void; // capability-gated
  setSpeed(mult: number): void;
  reset(): void;
  readonly state: TransportState;
  readonly capabilities: TransportCapabilities;
  subscribe(fn: (t: Transport) => void): () => void;
}

export const SPEED_MIN = 0.25;
export const SPEED_MAX = 4;
export const SPEED_DEFAULT = 1;

export function clampSpeed(mult: number): number {
  if (Number.isNaN(mult)) return SPEED_DEFAULT;
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, mult));
}
