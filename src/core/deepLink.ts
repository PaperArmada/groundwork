// Deep-link mechanics — specs/000 S2.5. Pattern: #/m/{moduleId}?{params}.
// The shell owns these; modules only see URLSearchParams via ModuleProps.

export interface ParsedHash {
  /** '' for the catalog, or the module id from #/m/{id}. */
  moduleId: string;
  params: URLSearchParams;
}

export function parseHash(hash: string): ParsedHash {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const qIndex = raw.indexOf('?');
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  const query = qIndex === -1 ? '' : raw.slice(qIndex + 1);
  const match = /^\/m\/([^/?]+)$/.exec(path);
  return {
    moduleId: match?.[1] ?? '',
    params: new URLSearchParams(query),
  };
}

export function buildHash(moduleId: string, params: URLSearchParams): string {
  const path = moduleId === '' ? '#/' : `#/m/${moduleId}`;
  const query = params.toString();
  return query === '' ? path : `${path}?${query}`;
}

/** Trailing debounce, for replaceState writes (S2.5). */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, waitMs);
  };
}
