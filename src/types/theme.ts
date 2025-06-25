
export type Theme = 'light' | 'dark' | 'system';

export interface UserSettings {
  theme: Theme;
  notifications: boolean;
  autoSave: boolean;
  language: string;
}
