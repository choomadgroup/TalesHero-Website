import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AuthUser {
  username:    string;
  nickname:    string;
  gameId:      string | null;
  cash:        number;
  mau:         number;
  tr:          number;
  email:       string;
  secQuestion: string;
  character:   string | null;
  exp:         number;
  level:       number;
  expPct:      number;
}

interface AuthContextType {
  user:   AuthUser | null;
  loading: boolean;
  login:  (user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.localStorage.removeItem('taleshero_user');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    fetch('/auth/me', { credentials: 'include', signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => {
        window.clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser(current => {
      if (!current) return current;
      return { ...current, ...updates };
    });
  };

  const refreshUser = async () => {
    try {
      const res = await fetch('/auth/me', { credentials: 'include' });
      const data = res.ok ? await res.json() : null;
      setUser(data?.user ?? null);
    } catch {
      // sesi tetap valid, abaikan error jaringan sementara
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, updateUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return ctx;
}
