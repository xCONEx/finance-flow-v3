import { useState, useEffect } from 'react';

const STORAGE_KEY = 'recent_accounts';

export function useRecentAccounts(currentEmail?: string) {
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setAccounts(parsed);
      } catch {}
    }
  }, []);

  // Adiciona uma conta ao topo da lista
  function addAccount(email: string) {
    setAccounts(prev => {
      const filtered = prev.filter(e => e !== email);
      const updated = [email, ...filtered].slice(0, 5); // Limite de 5 contas
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  // Remove uma conta
  function removeAccount(email: string) {
    setAccounts(prev => {
      const updated = prev.filter(e => e !== email);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  // Limpa todas as contas
  function clearAccounts() {
    setAccounts([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Sempre que o e-mail atual mudar, adiciona à lista
  useEffect(() => {
    if (currentEmail) addAccount(currentEmail);
    // eslint-disable-next-line
  }, [currentEmail]);

  return {
    accounts,
    addAccount,
    removeAccount,
    clearAccounts,
  };
} 