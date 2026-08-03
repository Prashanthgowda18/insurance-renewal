import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
      // Bypass authentication completely
      const dummyAdmin = { id: 'admin', name: 'Admin User', email: 'admin@example.com', role: 'admin' };
      setToken('dummy-token');
      setAdmin(dummyAdmin);
      setLoading(false);
    };

    bootstrap();
  }, []);

  const login = (jwtToken: string, adminUser: AdminUser) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('admin', JSON.stringify(adminUser));
    setToken(jwtToken);
    setAdmin(adminUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setToken(null);
    setAdmin(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, admin, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
