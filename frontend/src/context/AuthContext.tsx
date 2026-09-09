import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService, type AuthUser } from '../services/auth.service';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('rs_user');
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('rs_token'),
  );

  const persist = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);

    localStorage.setItem('rs_user', JSON.stringify(u));
    localStorage.setItem('rs_token', t);
  };

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const data = await authService.login(email, password);

    persist(data.user, data.token);

    return data.user;
  };

  const register = async (
    email: string,
    password: string,
    nickname: string
  ) => {
    const data = await authService.register(email, password, nickname);

    persist(data.user, data.token);
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Error al cerrar sesión en backend:', error);
    } finally {
      // 🔥 LIMPIAR TODO
      setUser(null);
      setToken(null);
      localStorage.removeItem('rs_user');
      localStorage.removeItem('rs_token');
      sessionStorage.clear(); // Por si acaso
      
      // 🔥 FORZAR RECARGA DE LA PÁGINA PARA LIMPIAR EL ESTADO
      window.location.href = '/';
    }
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;

      const next = { ...prev, ...patch };

      localStorage.setItem('rs_user', JSON.stringify(next));

      return next;
    });
  };

  // 🔥 Sincronizar el estado con localStorage (por si cambia desde fuera)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('rs_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      const tokenStored = localStorage.getItem('rs_token');
      setToken(tokenStored);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}