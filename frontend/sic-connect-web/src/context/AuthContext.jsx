import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { apiClient, getToken, setToken, setUnauthorizedHandler } from '../lib/apiClient.js';

const AuthContext = createContext(null);

const USER_KEY = 'sic_connect_user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Holds the JWT and the current user. Exposes login/register/logout. The token is
 * persisted in localStorage (see apiClient); a 401 anywhere clears the session.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? readStoredUser() : null));
  const [initialising, setInitialising] = useState(false);

  const applySession = useCallback((auth) => {
    setToken(auth.token);
    const nextUser = {
      userId: auth.userId,
      email: auth.email,
      fullName: auth.fullName,
      role: auth.role,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Wire the apiClient 401 handler to our logout so expired tokens end the session.
  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(
    async (credentials) => {
      const { data } = await apiClient.post('/auth/login', credentials);
      return applySession(data);
    },
    [applySession],
  );

  // Registration no longer signs the user in — new accounts await administrator approval.
  const register = useCallback(async (payload) => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data; // RegistrationResultDto { status, message, requiresApproval }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'Admin',
      isMentor: user?.role === 'Mentor',
      initialising,
      login,
      register,
      logout,
      setInitialising,
    }),
    [user, initialising, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
