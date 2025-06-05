
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
    });
  };

  const parseCurrency = (val: string): number => {
    // Remove tudo exceto números
    const numbers = val.replace(/\D/g, '');
    // Converte de centavos para reais
    return parseInt(numbers || '0') / 100;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove tudo exceto números
    const numbers = inputValue.replace(/\D/g, '');
    
    if (numbers === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Converte para número (em centavos)
    const numericValue = parseInt(numbers) / 100;
    
    // Formata e atualiza display
    const formatted = formatCurrency(numericValue);
    setDisplayValue(formatted);
    
    // Chama onChange com o valor numérico
    onChange(numericValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleBlur = () => {
    if (value === 0) {
      setDisplayValue('');
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
