// Prediction ledger — schema and first-commitment policy are normative in
// specs/000 S2.4; the implementation is spec 002's deliverable. The summary
// is always computed from stored records (P4): no shadow tally exists that
// could drift from what localStorage actually holds.

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

export interface LedgerSummary {
  total: number;
  withinRange: number;
  pct: number;
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface Ledger {
  record(
    entry: Omit<PredictionRecord, 'attempt' | 'committedAt'>,
  ): PredictionRecord;
  /** First commitment counts: computed over attempt === 1 only (P6). */
  summary(): LedgerSummary;
  listByModule(moduleId: string): PredictionRecord[];
  listAll(): PredictionRecord[];
  attemptsFor(id: string): number;
  clear(): void; // exposed in fixture only for now (002 §11)
  subscribe(fn: () => void): () => void;
}

export function createLedger(storage: StorageLike): Ledger {
  const listeners = new Set<() => void>();

  function load(): PredictionRecord[] {
    try {
      const raw = storage.getItem(LEDGER_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PredictionRecord[]) : [];
    } catch {
      return [];
    }
  }

  function save(records: PredictionRecord[]) {
    try {
      storage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // storage unavailable — the ledger degrades to session-silent
    }
    for (const fn of listeners) fn();
  }

  return {
    record(entry) {
      const records = load();
      const record: PredictionRecord = {
        ...entry,
        attempt: records.filter((r) => r.id === entry.id).length + 1,
        committedAt: new Date().toISOString(),
      };
      records.push(record);
      save(records);
      return record;
    },
    summary() {
      const firsts = load().filter((r) => r.attempt === 1);
      const within = firsts.filter((r) => r.withinRange).length;
      return {
        total: firsts.length,
        withinRange: within,
        pct: firsts.length === 0 ? 0 : Math.round((within / firsts.length) * 100),
      };
    },
    listByModule(moduleId) {
      return load().filter((r) => r.moduleId === moduleId);
    },
    listAll() {
      return load();
    },
    attemptsFor(id) {
      return load().filter((r) => r.id === id).length;
    },
    clear() {
      try {
        storage.removeItem(LEDGER_STORAGE_KEY);
      } catch {
        // nothing to clear if storage is unavailable
      }
      for (const fn of listeners) fn();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

const memoryStorage = (): StorageLike => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
};

/** The app-wide ledger, bound to localStorage (memory-backed fallback). */
export const ledger: Ledger = createLedger(
  typeof localStorage === 'undefined' ? memoryStorage() : localStorage,
);
