// providers/AuthProvider.tsx
import { createContext, useState, type ReactNode } from 'react';
import type { AuthUser, AuthContextType } from '../hooks/useAuth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
