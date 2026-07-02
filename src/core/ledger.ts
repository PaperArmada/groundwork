// Prediction-ledger contract — normative in specs/000 S2.4. Types and the
// storage key only; the implementation is spec 002's deliverable. Declared
// here so 002 builds against compiler-checked shapes.

export interface PredictionRecord {
  id: string; // `${moduleId}.${predictionId}` — stable
  moduleId: string;
  kind: 'number' | 'range' | 'order' | 'choice';
  guess: unknown;
  actual: unknown;
  withinRange: boolean; // per-prediction tolerance, defined in module spec
  committedAt: string; // ISO 8601
  attempt: number; // 1, 2, …
}

export const LEDGER_STORAGE_KEY = 'gw.ledger.v1';
