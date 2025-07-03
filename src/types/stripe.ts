import { Stripe } from '@stripe/stripe-js';

// Tipos para planos de assinatura
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
  description?: string;
  popular?: boolean;
}

// Tipos para dados de pagamento
export interface PaymentData {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

// Tipos para dados de cliente
export interface CustomerData {
  email: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

// Tipos para dados de assinatura
export interface SubscriptionData {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

// Tipos para webhook events
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// Tipos para resposta de pagamento
export interface PaymentResponse {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: {
    message: string;
    code?: string;
  };
}

// Tipos para resposta de assinatura
export interface SubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  customerId?: string;
  status?: string;
  error?: {
    message: string;
    code?: string;
  };
}

// Tipos para histórico de pagamentos
export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description?: string;
  receiptUrl?: string;
}

// Tipos para dados de fatura
export interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  dueDate?: number;
  paidAt?: number;
  receiptUrl?: string;
}

// Tipos para configuração do Stripe
export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  apiVersion: string;
}

// Tipos para elementos do Stripe
export interface StripeElementsOptions {
  clientSecret?: string;
  appearance?: {
    theme?: 'stripe' | 'night';
    variables?: {
      colorPrimary?: string;
      colorBackground?: string;
      colorText?: string;
      colorDanger?: string;
      fontFamily?: string;
      spacingUnit?: string;
      borderRadius?: string;
    };
  };
}

// Tipos para hook personalizado do Stripe
export interface UseStripeReturn {
  stripe: Stripe | null;
  elements: any;
  loading: boolean;
  error: string | null;
  createPaymentIntent: (data: PaymentData) => Promise<PaymentResponse>;
  createSubscription: (data: SubscriptionData) => Promise<SubscriptionResponse>;
  cancelSubscription: (subscriptionId: string) => Promise<boolean>;
  getPaymentHistory: () => Promise<PaymentHistoryItem[]>;
  getInvoices: () => Promise<InvoiceData[]>;
}

// Tipos para props dos componentes
export interface PaymentFormProps {
  amount: number;
  currency?: string;
  description?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  loading?: boolean;
}

export interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  currentPlan?: string;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  loading?: boolean;
}

export interface PaymentHistoryProps {
  payments: PaymentHistoryItem[];
  loading?: boolean;
  onRefresh?: () => void;
}

export interface BillingPortalProps {
  customerId: string;
  returnUrl?: string;
}

// Tipos para integração com Supabase
export interface SupabaseStripeSync {
  userId: string;
  stripeCustomerId: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  updatedAt: number;
}

// Tipos para notificações de pagamento
export interface PaymentNotification {
  type: 'payment_success' | 'payment_failed' | 'subscription_created' | 'subscription_cancelled';
  userId: string;
  data: {
    amount?: number;
    currency?: string;
    subscriptionId?: string;
    paymentIntentId?: string;
  };
  timestamp: number;
}

// Tipos para relatórios financeiros
export interface FinancialReport {
  period: {
    start: number;
    end: number;
  };
  revenue: {
    total: number;
    currency: string;
    subscriptions: number;
    oneTimePayments: number;
  };
  subscriptions: {
    active: number;
    cancelled: number;
    new: number;
  };
  payments: {
    successful: number;
    failed: number;
    pending: number;
  };
}

// Tipos para configuração de webhooks
export interface WebhookConfig {
  endpoint: string;
  events: string[];
  description?: string;
  enabled: boolean;
}

// Tipos para logs de transação
export interface TransactionLog {
  id: string;
  type: 'payment' | 'subscription' | 'refund' | 'webhook';
  status: 'success' | 'failed' | 'pending';
  data: any;
  timestamp: number;
  userId?: string;
  error?: string;
} 