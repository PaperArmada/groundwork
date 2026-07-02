import { useEffect } from 'react';
import type { ModuleProps } from '../../core/moduleDef.ts';
import Content from './content.mdx';
import { ModuleUrlContext } from './urlContext.ts';
import styles from './lesson.module.css';

export default function WhyIsItSlow({ urlState, onStateChange }: ModuleProps) {
  // Deep links with scene=race land on the race once it exists in the DOM.
  // (Predictions gate the scenes, so a fresh visitor still commits first.)
  useEffect(() => {
    if (urlState.get('scene') === 'race') {
      document
        .querySelector('[data-scene="race"]')
        ?.scrollIntoView({ block: 'start' });
    }
    // mount-only by design: scrolling must not re-fire on param changes
  }, []);

  return (
    <ModuleUrlContext.Provider value={{ urlState, onStateChange }}>
      <article className={styles.lesson}>
        <Content />
      </article>
    </ModuleUrlContext.Provider>
  );
}
