import { createContext, useContext, useState, ReactNode } from 'react';

export const ALL_STATES = 'ALL';

interface StateFilterCtx {
  selectedState: string;
  setSelectedState: (s: string) => void;
}

const Ctx = createContext<StateFilterCtx | undefined>(undefined);

export const StateFilterProvider = ({ children }: { children: ReactNode }) => {
  const [selectedState, setSelectedState] = useState<string>(ALL_STATES);
  return <Ctx.Provider value={{ selectedState, setSelectedState }}>{children}</Ctx.Provider>;
};

export const useStateFilter = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStateFilter must be used within StateFilterProvider');
  return ctx;
};
