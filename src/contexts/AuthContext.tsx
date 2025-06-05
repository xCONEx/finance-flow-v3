
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user from localStorage
    const savedUser = localStorage.getItem('financeflow_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - replace with Firebase
    const mockUser: User = {
      id: '1',
      email,
      name: 'Usuário Demo',
      userType: 'individual',
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    localStorage.setItem('financeflow_user', JSON.stringify(mockUser));
  };

  const loginWithGoogle = async () => {
    // Mock Google login - replace with Firebase
    const mockUser: User = {
      id: '1',
      email: 'user@gmail.com',
      name: 'Usuário Google',
      userType: 'individual',
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    localStorage.setItem('financeflow_user', JSON.stringify(mockUser));
  };

  const register = async (email: string, password: string, name: string) => {
    // Mock register - replace with Firebase
    const mockUser: User = {
      id: '1',
      email,
      name,
      userType: 'individual',
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    localStorage.setItem('financeflow_user', JSON.stringify(mockUser));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('financeflow_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      logout,
      register,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
