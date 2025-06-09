
import React, { useState, useEffect } from 'react';
import { Input } from './input';

interface PercentageInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
  value,
  onChange,
  placeholder = "0",
  className,
  id
}) => {
  const [displayValue, setDisplayValue] = useState(value.toString());

  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove all non-digit characters except dot
    const cleanValue = inputValue.replace(/[^\d.]/g, '');
    
    // Limit to 100%
    const numericValue = Math.min(100, Math.max(0, parseFloat(cleanValue) || 0));
    
    setDisplayValue(cleanValue);
    onChange(numericValue);
  };

  const handleBlur = () => {
    setDisplayValue(value.toString());
  };

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} pr-8`}
      />
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        %
      </span>
    </div>
  );
};
