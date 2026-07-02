import { useEffect, useState } from 'react';
import { parseHash } from '../core/deepLink.ts';
import { Catalog } from './Catalog.tsx';
import { Header } from './Header.tsx';
import { ModuleHost } from './ModuleHost.tsx';
import styles from './App.module.css';

export function App() {
  const [moduleId, setModuleId] = useState(
    () => parseHash(window.location.hash).moduleId,
  );

  useEffect(() => {
    const onHashChange = () =>
      setModuleId(parseHash(window.location.hash).moduleId);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        {moduleId === '' ? (
          <Catalog />
        ) : (
          <ModuleHost key={moduleId} moduleId={moduleId} />
        )}
      </main>
    </div>
  );
}
