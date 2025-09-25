import { createContext, useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'breakwaters.auth';

const getInitialAuthState = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { user: null, token: null };
    }

    const parsed = JSON.parse(stored);
    const user = parsed?.user ?? null;
    const token = typeof parsed?.token === 'string' ? parsed.token : null;

    if (token && typeof user === 'object') {
      return { user, token };
    }

    return { user: null, token: null };
  } catch (error) {
    console.warn('Failed to parse stored auth state', error);
    return { user: null, token: null };
  }
};

export const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  setUser: () => {},
});

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => getInitialAuthState());

  const syncStorage = useCallback((nextState) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (nextState?.token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback((user, token) => {
    if (!user || !token) {
      const emptyState = { user: null, token: null };
      syncStorage(emptyState);
      setAuthState(emptyState);
      return;
    }

    const nextState = { user, token };
    syncStorage(nextState);
    setAuthState(nextState);
  }, [syncStorage]);

  const logout = useCallback(() => {
    const emptyState = { user: null, token: null };
    syncStorage(emptyState);
    setAuthState(emptyState);
  }, [syncStorage]);

  const setUser = useCallback((updater) => {
    setAuthState((previous) => {
      const current = previous ?? { user: null, token: null };
      const nextUser = typeof updater === 'function' ? updater(current.user) : updater;
      const nextState = { user: nextUser ?? null, token: current.token ?? null };
      syncStorage(nextState);
      return nextState;
    });
  }, [syncStorage]);

  const value = useMemo(() => ({
    user: authState.user,
    token: authState.token,
    login,
    logout,
    setUser,
  }), [authState.user, authState.token, login, logout, setUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
