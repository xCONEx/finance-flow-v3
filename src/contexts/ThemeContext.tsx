
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

export interface UserSettings {
  theme: Theme;
  colorTheme: string;
  notifications: boolean;
  language: 'pt-BR';
}

export interface ThemeContextType {
  theme: Theme;
  currentTheme: any;
  userSettings: UserSettings;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: string) => void;
  setNotifications: (enabled: boolean) => void;
  applyTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const defaultSettings: UserSettings = {
  theme: 'light',
  colorTheme: 'blue',
  notifications: true,
  language: 'pt-BR',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultSettings);
  const [theme, setThemeState] = useState<Theme>('light');

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    setThemeState(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setUserSettings(prev => ({ ...prev, theme: newTheme }));
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setColorTheme = (colorTheme: string) => {
    setUserSettings(prev => ({ ...prev, colorTheme }));
    localStorage.setItem('colorTheme', colorTheme);
  };

  const setNotifications = (enabled: boolean) => {
    setUserSettings(prev => ({ ...prev, notifications: enabled }));
    localStorage.setItem('notifications', enabled.toString());
  };

  // Load saved settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedColorTheme = localStorage.getItem('colorTheme');
    const savedNotifications = localStorage.getItem('notifications');

    const loadedSettings: UserSettings = {
      theme: savedTheme || 'light',
      colorTheme: savedColorTheme || 'blue',
      notifications: savedNotifications ? savedNotifications === 'true' : true,
      language: 'pt-BR',
    };

    setUserSettings(loadedSettings);
    applyTheme(loadedSettings.theme);
  }, []);

  // Current theme configuration
  const currentTheme = {
    primary: 'from-blue-500 to-blue-600',
    secondary: 'from-blue-50 to-blue-100',
    accent: 'blue-600',
  };

  const value: ThemeContextType = {
    theme,
    currentTheme,
    userSettings,
    setTheme,
    setColorTheme,
    setNotifications,
    applyTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
