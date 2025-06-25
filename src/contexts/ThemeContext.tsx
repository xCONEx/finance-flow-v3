
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, UserSettings } from '@/types/theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  // Legacy properties that components are expecting
  isDark: boolean;
  currentTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  toggleDarkMode: () => void;
  changeTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: 'system',
    notifications: true,
    autoSave: true,
    language: 'pt-BR'
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme: 'light' | 'dark';
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }
    
    root.classList.add(effectiveTheme);
    setIsDark(effectiveTheme === 'dark');
  }, [theme]);

  const updateUserSettings = (settings: Partial<UserSettings>) => {
    const newSettings = { ...userSettings, ...settings };
    setUserSettings(newSettings);
    if (settings.theme) {
      setTheme(settings.theme);
    }
  };

  const toggleDarkMode = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    updateUserSettings({ theme: newTheme });
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    updateUserSettings({ theme: newTheme });
  };

  // Theme colors based on current theme
  const currentTheme = {
    primary: isDark ? 'from-purple-600 to-blue-600' : 'from-purple-600 to-blue-600',
    secondary: isDark ? 'from-gray-800 to-gray-700' : 'from-gray-100 to-gray-200',
    accent: isDark ? 'purple-400' : 'purple-600'
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      userSettings, 
      updateUserSettings,
      isDark,
      currentTheme,
      toggleDarkMode,
      changeTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
