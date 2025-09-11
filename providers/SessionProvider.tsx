import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/utils/notifications.utils';
import { getFirebaseApp } from '@/utils/firebase.utils';

export interface SessionUserProfile {
  id?: string;
  name?: string | null;
  email?: string | null;
  photo?: string | null;
  familyName?: string | null;
  givenName?: string | null;
}

export interface SessionState {
  fcmToken: string | null;
  fcmReady: boolean;
  authReady: boolean;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: SessionUserProfile;
}

interface SessionContextValue {
  session: SessionState;
  setSession: React.Dispatch<React.SetStateAction<SessionState>>;
  waitForFcmToken: (timeoutMs?: number) => Promise<string | null>;
  updateAfterLogin: (data: { idToken: string; profile: SessionUserProfile; accessToken?: string; refreshToken?: string }) => void;
  clearSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const FCM_STORAGE_KEY = 'session.fcmToken';

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionState>({ fcmToken: null, fcmReady: false, authReady: false });
  const waitersRef = useRef<((token: string | null) => void)[]>([]);
  const initializingRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;
      try {
        const cached = await AsyncStorage.getItem(FCM_STORAGE_KEY);
        if (cached) {
          setSession((s) => ({ ...s, fcmToken: cached, fcmReady: true }));
          resolveWaiters(cached);
        }
        getFirebaseApp();
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await AsyncStorage.setItem(FCM_STORAGE_KEY, token);
          setSession((s) => ({ ...s, fcmToken: token, fcmReady: true }));
          resolveWaiters(token);
        } else {
          setSession((s) => ({ ...s, fcmReady: true }));
          resolveWaiters(null);
        }
      } catch (e) {
        console.log('[SessionProvider] FCM init error:', (e as any)?.message || e);
        setSession((s) => ({ ...s, fcmReady: true }));
        resolveWaiters(null);
      }
    };
    init();
  }, []);

  const resolveWaiters = (token: string | null) => {
    waitersRef.current.forEach((res) => res(token));
    waitersRef.current = [];
  };

  const waitForFcmToken = (timeoutMs = 7000): Promise<string | null> => {
    if (session.fcmReady) return Promise.resolve(session.fcmToken);
    return new Promise((resolve) => {
      waitersRef.current.push(resolve);
      setTimeout(() => {
        resolve(session.fcmToken);
      }, timeoutMs);
    });
  };

  const updateAfterLogin = (data: { idToken: string; profile: SessionUserProfile; accessToken?: string; refreshToken?: string }) => {
    setSession((s) => ({
      ...s,
      idToken: data.idToken,
      user: { ...s.user, ...data.profile },
      accessToken: data.accessToken || s.accessToken,
      refreshToken: data.refreshToken || s.refreshToken,
      authReady: true,
    }));
  };

  const clearSession = async () => {
    await AsyncStorage.removeItem(FCM_STORAGE_KEY);
    setSession({ fcmToken: null, fcmReady: true, authReady: false });
  };

  return (
    <SessionContext.Provider value={{ session, setSession, waitForFcmToken, updateAfterLogin, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
  return ctx;
};

// Convenience selector-style hook to reduce re-renders elsewhere
export const useSessionUser = () => {
  const { session } = useSession();
  return {
    fcmToken: session.fcmToken,
    user: session.user,
    idToken: session.idToken,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    authReady: session.authReady,
    fcmReady: session.fcmReady,
  };
};
