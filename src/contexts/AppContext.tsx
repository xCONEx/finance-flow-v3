
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';

interface AppContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSupabaseAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  return (
    <AppContext.Provider value={{
      currentView,
      setCurrentView,
      sidebarOpen,
      setSidebarOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
