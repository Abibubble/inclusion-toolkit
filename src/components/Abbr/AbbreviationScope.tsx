import { type ReactNode, createContext, use, useState } from 'react';

import type { Abbreviation } from '../../content/abbreviations';

interface FirstUses {
  /** The first instance claims the name so re-renders don't change which one is expanded */
  isFirst: (name: Abbreviation, id: string) => boolean;
}

const FirstUsesContext = createContext<FirstUses | null>(null);

/** Each page needs its own scope, and prerendering must choose the same first use as the browser */
export function AbbreviationScope({ children }: { children: ReactNode }) {
  const [firstUses] = useState<FirstUses>(() => {
    const owners = new Map<Abbreviation, string>();
    return {
      isFirst(name, id) {
        const owner = owners.get(name);
        if (owner === undefined) owners.set(name, id);
        return (owner ?? id) === id;
      },
    };
  });

  return <FirstUsesContext value={firstUses}>{children}</FirstUsesContext>;
}

export function useFirstUses(): FirstUses | null {
  return use(FirstUsesContext);
}
