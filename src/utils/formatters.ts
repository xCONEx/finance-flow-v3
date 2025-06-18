
export const formatCurrency = (value: number): string => {
  // Garantir que o valor é um número válido
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeValue);
};

export const parseCurrency = (value: string): number => {
  if (!value || typeof value !== 'string') return 0;
  
  // Remove all non-numeric characters except comma and dot
  const cleanValue = value.replace(/[^\d,]/g, '');
  
  // Replace comma with dot for parsing
  const normalizedValue = cleanValue.replace(',', '.');
  
  return parseFloat(normalizedValue) || 0;
};

export const formatCurrencyInput = (value: string): string => {
  if (!value || typeof value !== 'string') return formatCurrency(0);
  
  const numbers = value.replace(/\D/g, '');
  const amount = parseInt(numbers) / 100;
  return formatCurrency(amount);
};

export const calculateDepreciation = (value: number, years: number = 5): number => {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const safeYears = typeof years === 'number' && years > 0 ? years : 5;
  
  return safeValue / (safeYears * 12); // Depreciação mensal
};

export const getDifficultyMultiplier = (difficulty: string): number => {
  if (!difficulty || typeof difficulty !== 'string') return 1;
  
  switch (difficulty.toLowerCase()) {
    case 'fácil': return 1;
    case 'médio': return 1.2;
    case 'difícil': return 1.5;
    case 'muito difícil': return 2;
    default: return 1;
  }
};

export const formatPercentage = (value: number): string => {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `${safeValue.toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  return safeValue.toLocaleString('pt-BR');
};

// Função auxiliar para formatar valores de forma segura
export const safeFormatCurrency = (value: any): string => {
  if (value === null || value === undefined) return formatCurrency(0);
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return formatCurrency(isNaN(parsed) ? 0 : parsed);
  }
  if (typeof value === 'number') {
    return formatCurrency(isNaN(value) ? 0 : value);
  }
  return formatCurrency(0);
};

// Função auxiliar para formatar números de forma segura
export const safeFormatNumber = (value: any): string => {
  if (value === null || value === undefined) return formatNumber(0);
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return formatNumber(isNaN(parsed) ? 0 : parsed);
  }
  if (typeof value === 'number') {
    return formatNumber(isNaN(value) ? 0 : value);
  }
  return formatNumber(0);
};
