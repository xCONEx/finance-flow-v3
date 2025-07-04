import { PaymentHistoryItem, InvoiceData, SubscriptionPlan } from '../types/stripe';

/**
 * Formata valor monetário para exibição
 */
export const formatCurrency = (amount: number, currency: string = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Converte valor de centavos para reais
 */
export const centsToReais = (cents: number): number => {
  return cents / 100;
};

/**
 * Converte valor de reais para centavos
 */
export const reaisToCents = (reais: number): number => {
  return Math.round(reais * 100);
};

/**
 * Formata data para exibição
 */
export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(timestamp * 1000));
};

/**
 * Formata data e hora para exibição
 */
export const formatDateTime = (timestamp: number): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
};

/**
 * Obtém o status traduzido do pagamento
 */
export const getPaymentStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'succeeded': 'Pago',
    'processing': 'Processando',
    'requires_payment_method': 'Aguardando pagamento',
    'requires_confirmation': 'Aguardando confirmação',
    'requires_action': 'Ação necessária',
    'canceled': 'Cancelado',
    'failed': 'Falhou',
  };

  return statusMap[status] || status;
};

/**
 * Obtém a cor do status do pagamento
 */
export const getPaymentStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'succeeded': 'text-green-600 bg-green-100',
    'processing': 'text-yellow-600 bg-yellow-100',
    'requires_payment_method': 'text-orange-600 bg-orange-100',
    'requires_confirmation': 'text-blue-600 bg-blue-100',
    'requires_action': 'text-purple-600 bg-purple-100',
    'canceled': 'text-gray-600 bg-gray-100',
    'failed': 'text-red-600 bg-red-100',
  };

  return colorMap[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Obtém o status traduzido da assinatura
 */
export const getSubscriptionStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Ativa',
    'canceled': 'Cancelada',
    'incomplete': 'Incompleta',
    'incomplete_expired': 'Expirada',
    'past_due': 'Vencida',
    'trialing': 'Período de teste',
    'unpaid': 'Não paga',
  };

  return statusMap[status] || status;
};

/**
 * Obtém a cor do status da assinatura
 */
export const getSubscriptionStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'active': 'text-green-600 bg-green-100',
    'canceled': 'text-gray-600 bg-gray-100',
    'incomplete': 'text-yellow-600 bg-yellow-100',
    'incomplete_expired': 'text-red-600 bg-red-100',
    'past_due': 'text-orange-600 bg-orange-100',
    'trialing': 'text-blue-600 bg-blue-100',
    'unpaid': 'text-red-600 bg-red-100',
  };

  return colorMap[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Calcula o valor total dos pagamentos
 */
export const calculateTotalPayments = (payments: PaymentHistoryItem[]): number => {
  return payments.reduce((total, payment) => {
    if (payment.status === 'succeeded') {
      return total + payment.amount;
    }
    return total;
  }, 0);
};

/**
 * Filtra pagamentos por status
 */
export const filterPaymentsByStatus = (
  payments: PaymentHistoryItem[],
  status: string
): PaymentHistoryItem[] => {
  return payments.filter(payment => payment.status === status);
};

/**
 * Agrupa pagamentos por mês
 */
export const groupPaymentsByMonth = (payments: PaymentHistoryItem[]) => {
  const grouped: Record<string, PaymentHistoryItem[]> = {};

  payments.forEach(payment => {
    const date = new Date(payment.created * 1000);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    
    grouped[monthKey].push(payment);
  });

  return grouped;
};

/**
 * Calcula estatísticas dos pagamentos
 */
export const calculatePaymentStats = (payments: PaymentHistoryItem[]) => {
  const total = calculateTotalPayments(payments);
  const successful = filterPaymentsByStatus(payments, 'succeeded').length;
  const failed = filterPaymentsByStatus(payments, 'failed').length;
  const pending = payments.length - successful - failed;

  return {
    total,
    successful,
    failed,
    pending,
    totalCount: payments.length,
  };
};

/**
 * Valida número de cartão de crédito (Luhn algorithm)
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Mascara número de cartão de crédito
 */
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const masked = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  return masked.replace(/(\d{4})\s(\d{4})\s(\d{4})\s(\d{1,4})/, '$1 **** **** $4');
};

/**
 * Valida CVV
 */
export const validateCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv);
};

/**
 * Valida data de expiração
 */
export const validateExpiryDate = (expiry: string): boolean => {
  const [month, year] = expiry.split('/');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  const expMonth = parseInt(month);
  const expYear = parseInt(year);

  if (expMonth < 1 || expMonth > 12) {
    return false;
  }

  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    return false;
  }

  return true;
};

/**
 * Calcula desconto baseado em cupom
 */
export const calculateDiscount = (originalPrice: number, discountPercent: number): number => {
  return (originalPrice * discountPercent) / 100;
};

/**
 * Calcula preço com desconto
 */
export const calculateDiscountedPrice = (originalPrice: number, discountPercent: number): number => {
  const discount = calculateDiscount(originalPrice, discountPercent);
  return originalPrice - discount;
};

/**
 * Gera ID único para transação
 */
export const generateTransactionId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Verifica se o plano está ativo
 */
export const isPlanActive = (plan: SubscriptionPlan, currentPlanId?: string): boolean => {
  return currentPlanId === plan.id;
};

/**
 * Obtém o melhor plano baseado no uso
 */
export const getRecommendedPlan = (
  usage: { projects: number; users: number },
  plans: SubscriptionPlan[]
): SubscriptionPlan | null => {
  // Lógica simples de recomendação baseada no número de projetos
  if (usage.projects <= 10) {
    return plans.find(plan => plan.id === 'basic') || null;
  } else if (usage.projects <= 50) {
    return plans.find(plan => plan.id === 'pro') || null;
  } else {
    return plans.find(plan => plan.id === 'enterprise') || null;
  }
};

/**
 * Calcula economia anual com plano anual
 */
export const calculateAnnualSavings = (monthlyPrice: number): number => {
  const annualPrice = monthlyPrice * 12;
  const annualDiscount = 0.20; // 20% de desconto no plano anual
  const discountedAnnualPrice = annualPrice * (1 - annualDiscount);
  
  return annualPrice - discountedAnnualPrice;
};

/**
 * Formata intervalo de assinatura
 */
export const formatInterval = (interval: string, count: number = 1): string => {
  const intervalMap: Record<string, string> = {
    'day': count === 1 ? 'dia' : 'dias',
    'week': count === 1 ? 'semana' : 'semanas',
    'month': count === 1 ? 'mês' : 'meses',
    'year': count === 1 ? 'ano' : 'anos',
  };

  return intervalMap[interval] || interval;
};

/**
 * Verifica se a assinatura está próxima do vencimento
 */
export const isSubscriptionNearExpiry = (expiryDate: number, daysThreshold: number = 7): boolean => {
  const now = Date.now();
  const expiry = expiryDate * 1000;
  const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
  
  return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
};

/**
 * Calcula dias restantes até o vencimento
 */
export const getDaysUntilExpiry = (expiryDate: number): number => {
  const now = Date.now();
  const expiry = expiryDate * 1000;
  const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
  
  return Math.max(0, Math.ceil(daysUntilExpiry));
}; 