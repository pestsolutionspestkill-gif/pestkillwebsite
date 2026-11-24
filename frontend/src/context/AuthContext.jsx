import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const STAFF = ['owner', 'manager', 'technician'];
export const homeFor = (user) => (STAFF.includes(user?.role) ? '/admin' : '/dashboard');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setLoading(false); return null; }
    try {
      const me = await api('/users/profile');
      setUser(me);
      return me;
    } catch (e) {
      if (e.status === 401) logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('demoUser');
    refresh();
    const onUnauthorized = () => logout();
    window.addEventListener('pk:unauthorized', onUnauthorized);
    return () => window.removeEventListener('pk:unauthorized', onUnauthorized);
  }, [refresh, logout]);

  const startSession = useCallback(({ user: u, token }) => {
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const login = useCallback(async (email, password) => startSession(await api('/users/login', { method: 'POST', body: { email, password } })), [startSession]);
  const register = useCallback(async (data) => startSession(await api('/users/register', { method: 'POST', body: data })), [startSession]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    startSession,
    logout,
    refresh,
    setUser,
    isAuthenticated: Boolean(user),
    isOwner: user?.role === 'owner',
    isManager: user?.role === 'manager',
    isTechnician: user?.role === 'technician',
    isStaff: STAFF.includes(user?.role),
    isClient: user?.role === 'client',
    can: (perm) => user?.role === 'owner' || Boolean(user?.permissions?.includes(perm)),
  }), [user, loading, login, register, startSession, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
