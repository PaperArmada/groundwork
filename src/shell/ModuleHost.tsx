import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from 'react';
import { buildHash, debounce, parseHash } from '../core/deepLink.ts';
import type { ModuleProps } from '../core/moduleDef.ts';
import { modules } from '../modules/manifest.ts';
import styles from './ModuleHost.module.css';

interface Props {
  moduleId: string;
}

export function ModuleHost({ moduleId }: Props) {
  const def = modules.find((m) => m.id === moduleId);
  const [Component, setComponent] = useState<ComponentType<ModuleProps> | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const [urlState, setUrlState] = useState(
    () => parseHash(window.location.hash).params,
  );

  useEffect(() => {
    if (!def) return;
    let cancelled = false;
    def
      .load()
      .then((mod) => {
        if (!cancelled) setComponent(() => mod.default);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [def]);

  // replaceState doesn't fire hashchange, so module-driven updates flow
  // through state; this effect only catches user edits to the URL bar.
  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash(window.location.hash);
      if (parsed.moduleId === moduleId) setUrlState(parsed.params);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [moduleId]);

  const writeUrl = useMemo(
    () =>
      debounce((params: URLSearchParams) => {
        history.replaceState(null, '', buildHash(moduleId, params));
      }, 150),
    [moduleId],
  );

  const onStateChange = useCallback(
    (params: URLSearchParams) => {
      setUrlState(params);
      writeUrl(params);
    },
    [writeUrl],
  );

  if (!def) {
    return (
      <p className={styles.notice}>
        There is no lesson at this address. <a href="#/">Back to lessons</a>
      </p>
    );
  }
  if (failed) {
    return <p className={styles.notice}>This lesson failed to load.</p>;
  }
  if (!Component) {
    return <p className={styles.notice}>Loading…</p>;
  }
  return (
    <div>
      <h1 className={styles.title}>{def.title}</h1>
      <Component urlState={urlState} onStateChange={onStateChange} />
    </div>
  );
}
