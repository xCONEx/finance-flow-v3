
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, UserSettings } from '../types';

interface ThemeContextType {
  isDark: boolean;
  currentTheme: Theme;
  settings: UserSettings;
  toggleDarkMode: () => void;
  changeTheme: (themeName: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

const defaultThemes: Record<string, Theme> = {
  'purple-blue': {
    name: 'Roxo & Azul',
    primary: 'from-purple-600 to-blue-600',
    secondary: 'from-purple-100 to-blue-100',
    accent: 'purple-600'
  },
  'green-blue': {
    name: 'Verde & Azul',
    primary: 'from-green-600 to-blue-600',
    secondary: 'from-green-100 to-blue-100',
    accent: 'green-600'
  },
  'orange-red': {
    name: 'Laranja & Vermelho',
    primary: 'from-orange-600 to-red-600',
    secondary: 'from-orange-100 to-red-100',
    accent: 'orange-600'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    colorTheme: 'purple-blue',
    notifications: true,
    language: 'pt-BR'
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('financeflow_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('financeflow_settings', JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings]);

  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const changeTheme = (themeName: string) => {
    setSettings(prev => ({ ...prev, colorTheme: themeName }));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ThemeContext.Provider value={{
      isDark: settings.theme === 'dark',
      currentTheme: defaultThemes[settings.colorTheme],
      settings,
      toggleDarkMode,
      changeTheme,
      updateSettings
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
