import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AthleteSummary, AuthSession, Join, Me, User } from '@kadro/shared';
import { api } from './api';
import { unregisterPush } from './push';
import { disconnectRealtime } from './realtime';

interface AuthState {
  ready: boolean;
  user: User | null;
  athlete: AthleteSummary | null;
  login(email: string, password: string): Promise<void>;
  join(dto: Join): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [athlete, setAthlete] = useState<AthleteSummary | null>(null);

  useEffect(() => {
    void (async () => {
      if (await api.loadTokens()) {
        try {
          const me = await api.get<Me>('/auth/me');
          setUser(me.user);
          setAthlete(me.athlete);
        } catch {
          await api.clearTokens();
        }
      }
      setReady(true);
    })();
  }, []);

  const applySession = useCallback(async (session: AuthSession) => {
    await api.setTokens(session);
    const me = await api.get<Me>('/auth/me');
    setUser(me.user);
    setAthlete(me.athlete);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await applySession(await api.post<AuthSession>('/auth/login', { email, password }));
    },
    [applySession],
  );

  const join = useCallback(
    async (dto: Join) => {
      await applySession(await api.post<AuthSession>('/invite/join', dto));
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await unregisterPush();
    disconnectRealtime();
    await api.post('/auth/logout').catch(() => undefined);
    await api.clearTokens();
    setUser(null);
    setAthlete(null);
  }, []);

  const value = useMemo(
    () => ({ ready, user, athlete, login, join, logout }),
    [ready, user, athlete, login, join, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth hors AuthProvider');
  return ctx;
}
