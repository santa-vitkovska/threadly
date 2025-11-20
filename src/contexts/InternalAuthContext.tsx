import { createContext, useContext, type ReactNode } from 'react';
import type { AuthContextValue } from '../types/auth';

const InternalAuthContext = createContext<AuthContextValue | undefined>(undefined);

interface InternalAuthProviderProps {
  children: ReactNode;
  auth: AuthContextValue;
}

export const InternalAuthProvider = ({ children, auth }: InternalAuthProviderProps) => {
  return (
    <InternalAuthContext.Provider value={auth}>
      {children}
    </InternalAuthContext.Provider>
  );
};

export const useInternalAuth = () => {
  const context = useContext(InternalAuthContext);
  if (context === undefined) {
    throw new Error('useInternalAuth must be used within an InternalAuthProvider');
  }
  return context;
};

