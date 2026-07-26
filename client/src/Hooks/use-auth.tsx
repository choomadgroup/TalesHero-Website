import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuthUser {
  username:    string;
  nickname:    string;
  gameId:      string | null;
  cash:        number;
  tr:          number;
  email:       string;
  secQuestion: string;
}

interface AuthContextType {
  user:   AuthUser | null;
  login:  (user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
}

const AUTH_KEY = 'taleshero_user';

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const login = (userData: AuthUser) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser(current => {
      if (!current) return current;
      const next = { ...current, ...updates };
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return ctx;
}
