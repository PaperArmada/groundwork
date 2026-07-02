// Module registration contract — normative in specs/000 S2.2.

import type { ComponentType } from 'react';

export interface ModuleProps {
  urlState: URLSearchParams; // deep-link state in
  onStateChange: (s: URLSearchParams) => void; // deep-link state out
}

export interface ModuleDef {
  id: string; // URL segment: #/m/{id}
  title: string; // felt-problem phrasing
  blurb: string; // one line for the catalog card
  load: () => Promise<{ default: ComponentType<ModuleProps> }>;
  hidden?: boolean; // fixtures set true
}
