
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
    console.log('🔄 PrivacyContext - toggleValuesVisibility chamado');
    console.log('🔄 Estado atual valuesHidden:', valuesHidden);
    
    setValuesHidden(prev => {
      const newValue = !prev;
      console.log('🔄 Novo valor valuesHidden:', newValue);
      return newValue;
    });
  };

  const formatValue = (value: number | string) => {
    console.log('💰 formatValue chamado com:', value, 'valuesHidden:', valuesHidden);
    
    if (valuesHidden) {
      console.log('💰 Retornando valor oculto');
      return '••••••';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const formatted = numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    
    console.log('💰 Retornando valor formatado:', formatted);
    return formatted;
  };

  console.log('🏗️ PrivacyProvider renderizando, valuesHidden:', valuesHidden);

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
