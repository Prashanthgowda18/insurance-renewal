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
      const storedToken = localStorage.getItem('token');
      const storedAdmin = localStorage.getItem('admin');

      if (storedToken && storedAdmin) {
        setToken(storedToken);
        try {
          setAdmin(JSON.parse(storedAdmin));
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('admin');
        }
      }

      // Silent Auto-login in background on first load
      try {
        const response = await axios.post(
          (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/auth/login',
          {
            email: 'admin@example.com',
            password: 'admin123',
          }
        );
        const { token: fetchedToken, admin: fetchedAdmin } = response.data;
        localStorage.setItem('token', fetchedToken);
        localStorage.setItem('admin', JSON.stringify(fetchedAdmin));
        setToken(fetchedToken);
        setAdmin(fetchedAdmin);
      } catch (err) {
        console.error('Silent auto-login failed. Ensure Express server is active.', err);
      } finally {
        setLoading(false);
      }
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
