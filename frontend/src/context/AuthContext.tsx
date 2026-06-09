import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { apiLogin, apiRegister, getMe, setToken, clearToken, type AuthUser } from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('FOTNEP_TOKEN');
    if (!token) return;
    setToken(token);
    getMe()
      .then(setUser)
      .catch(() => { clearToken(); setUser(null); });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await apiLogin(email, password);
    setToken(token);
    setUser(u);
    localStorage.setItem('FOTNEP_LOGGED_IN', u.name);
    window.dispatchEvent(new Event('fotnep-auth-change'));
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    await apiRegister(email, password, name);
    // Does not auto-login — Header.tsx switches to sign-in tab and shows success banner
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    localStorage.removeItem('FOTNEP_LOGGED_IN');
    window.dispatchEvent(new Event('fotnep-auth-change'));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
