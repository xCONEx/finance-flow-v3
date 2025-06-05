
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  const [valuesHidden, setValuesHidden] = useState(false);

  const toggleValuesVisibility = () => {
    console.log('Toggling values visibility from', valuesHidden, 'to', !valuesHidden);
    setValuesHidden(!valuesHidden);
  };

  const formatValue = (value: number | string) => {
    if (valuesHidden) {
      return '••••••';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
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
