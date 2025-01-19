import { createContext, useContext } from 'react';

const JamContext = createContext();

export function JamProvider({ children, initialJam, setJam }) {
  const value = {
    jam: initialJam,
    setJam
  };
  
  return (
    <JamContext.Provider value={value}>
      {children}
    </JamContext.Provider>
  );
}

export function useJam() {
  const context = useContext(JamContext);
  if (!context) {
    throw new Error('useJam must be used within a JamProvider');
  }
  return context;
} 