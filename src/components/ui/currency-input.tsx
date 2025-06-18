
import React, { useState, useEffect } from 'react';
import { Input } from './input';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = "0,00",
  className,
  id
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);

  const formatCurrency = (val: number): string => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace('R$', 'R$ ').trim();
  };

  const parseCurrency = (val: string): number => {
    // Remove tudo exceto números
    const numbersOnly = val.replace(/\D/g, '');
    
    // Se está vazio, retorna 0
    if (!numbersOnly) return 0;
    
    // Converter para centavos e depois para reais
    const numericValue = parseInt(numbersOnly) / 100;
    return isNaN(numericValue) ? 0 : numericValue;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Se está vazio, limpar tudo
    if (!inputValue) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Parse do valor (aceita múltiplos dígitos)
    const numericValue = parseCurrency(inputValue);
    
    // Formatar e atualizar display
    if (numericValue > 0) {
      const formatted = formatCurrency(numericValue);
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
    
    // Chamar onChange com o valor numérico
    onChange(numericValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleBlur = () => {
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatCurrency(value));
    }
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};
