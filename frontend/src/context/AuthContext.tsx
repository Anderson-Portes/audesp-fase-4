import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AudespUser {
  email: string;
  token?: string;
  tempoExpiracao?: number;
  expira_em?: number;
}


interface AuthContextData {
  user: AudespUser | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (token: string, user: AudespUser, tempoExpiracao?: number) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AudespUser | null>(() => {
    const storagedUser = localStorage.getItem('user');
    const storagedToken = localStorage.getItem('token');

    if (storagedToken && storagedUser) {
      try {
        return JSON.parse(storagedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const signIn = (newToken: string, userData: AudespUser, tempoExpiracao: number = 3600) => {
    const expiraEm = Date.now() + tempoExpiracao * 1000;
    const userWithExp: AudespUser = {
      ...userData,
      token: newToken,
      tempoExpiracao,
      expira_em: expiraEm
    };
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userWithExp));
    setToken(newToken);
    setUser(userWithExp);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Auto logout when token expires
  useEffect(() => {
    if (token && user?.expira_em) {
      const now = Date.now();
      const timeout = user.expira_em - now;
      if (timeout > 0) {
        const timer = setTimeout(() => {
          signOut();
        }, timeout);
        return () => clearTimeout(timer);
      } else {
        signOut();
      }
    }
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

