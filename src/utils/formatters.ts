
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numericValue) || 0;
};

export const formatCurrencyInput = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const amount = parseInt(numbers) / 100;
  return formatCurrency(amount);
};

export const calculateDepreciation = (value: number, years: number = 5): number => {
  return value / (years * 12); // Depreciação mensal
};

export const getDifficultyMultiplier = (difficulty: string): number => {
  switch (difficulty) {
    case 'fácil': return 1;
    case 'médio': return 1.2;
    case 'difícil': return 1.5;
    case 'muito difícil': return 2;
    default: return 1;
  }
};
