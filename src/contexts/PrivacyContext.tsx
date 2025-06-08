
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PrivacyContextType {
  valuesHidden: boolean;
  toggleValuesVisibility: () => void;
  formatValue: (value: number | string) => string;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};

interface PrivacyProviderProps {
  children: ReactNode;
}

export const PrivacyProvider = ({ children }: PrivacyProviderProps) => {
  const [valuesHidden, setValuesHidden] = useState(() => {
    const saved = localStorage.getItem('financeflow-values-hidden');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('financeflow-values-hidden', JSON.stringify(valuesHidden));
  }, [valuesHidden]);

  const toggleValuesVisibility = () => {
    console.log('🔄 PrivacyContext - toggleValuesVisibility chamado');
    setValuesHidden(prev => !prev);
  };

  const formatValue = (value: number | string) => {
    if (valuesHidden) {
      return '••••••';
    }
    
    // CORRIGIDO: Verificação mais robusta para valores undefined/null/NaN
    if (value === undefined || value === null || value === '') {
      return 'R$ 0,00';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    // Verificação adicional se o numValue é um número válido
    if (isNaN(numValue)) {
      return 'R$ 0,00';
    }
    
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <PrivacyContext.Provider value={{
      valuesHidden,
      toggleValuesVisibility,
      formatValue
    }}>
      {children}
    </PrivacyContext.Provider>
  );
};
