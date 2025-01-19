import { createContext, useContext, useState } from 'react';

const JamContext = createContext();

export function JamProvider({ children, initialJam }) {
  const [jam] = useState(initialJam);
  
  return (
    <JamContext.Provider value={jam}>
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