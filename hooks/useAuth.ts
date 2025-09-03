// hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';

export interface AuthUser {
    idToken: string;
    accessToken?: string;
    refreshToken?: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        photo: string | null;
        familyName: string | null;
        givenName: string | null;
    };
}

export type AuthContextType = {
    user: AuthUser | null;
    setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
};

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within <AuthProvider>');
    }
    return ctx;
}
