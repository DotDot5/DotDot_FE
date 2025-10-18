'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

interface ActiveTeamContextType {
  activeTeamId: number | null;
  setActiveTeamId: Dispatch<SetStateAction<number | null>>;
}

const ActiveTeamContext = createContext<ActiveTeamContextType | undefined>(undefined);

export function ActiveTeamProvider({ children }: { children: ReactNode }) {
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);

  return (
    <ActiveTeamContext.Provider value={{ activeTeamId, setActiveTeamId }}>
      {children}
    </ActiveTeamContext.Provider>
  );
}

export function useActiveTeam() {
  const context = useContext(ActiveTeamContext);
  if (context === undefined) {
    throw new Error('useActiveTeam must be used within a ActiveTeamProvider');
  }
  return context;
}
