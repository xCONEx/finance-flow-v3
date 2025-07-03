import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../integrations/supabase/client';
import {
  PaymentData,
  PaymentResponse,
  SubscriptionData,
  SubscriptionResponse,
  CustomerData,
  PaymentHistoryItem,
  InvoiceData,
  SupabaseStripeSync
} from '../types/stripe';

class StripeService {
  private stripe: Stripe | null = null;
  private isInitialized = false;

  /**
   * Inicializa o Stripe com a chave pública
   */
  async initialize(): Promise<Stripe | null> {
    if (this.isInitialized && this.stripe) {
      return this.stripe;
    }

    try {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!publishableKey) {
        throw new Error('Stripe publishable key não configurada');
      }

      this.stripe = await loadStripe(publishableKey);
      this.isInitialized = true;
      
      return this.stripe;
    } catch (error) {
      console.error('Erro ao inicializar Stripe:', error);
      throw error;
    }
  }

  /**
   * Cria um cliente no Stripe
   */
  async createCustomer(customerData: CustomerData): Promise<string> {
    try {
      const response = await fetch('/api/stripe/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar cliente');
      }

      const { customerId } = await response.json();
      return customerId;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  /**
   * Cria um Payment Intent para pagamento único
   */
  async createPaymentIntent(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            message: errorData.message || 'Erro ao criar payment intent',
            code: errorData.code,
          },
        };
      }

      const { clientSecret, paymentIntentId } = await response.json();
      
      return {
        success: true,
        clientSecret,
        paymentIntentId,
      };
    } catch (error) {
      console.error('Erro ao criar payment intent:', error);
      return {
        success: false,
        error: {
          message: 'Erro interno do servidor',
        },
      };
    }
  }

  /**
   * Cria uma assinatura recorrente
   */
  async createSubscription(subscriptionData: SubscriptionData): Promise<SubscriptionResponse> {
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            message: errorData.message || 'Erro ao criar assinatura',
            code: errorData.code,
          },
        };
      }

      const { subscriptionId, customerId, status } = await response.json();
      
      return {
        success: true,
        subscriptionId,
        customerId,
        status,
      };
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      return {
        success: false,
        error: {
          message: 'Erro interno do servidor',
        },
      };
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar assinatura');
      }

      return true;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return false;
    }
  }

  /**
   * Atualiza uma assinatura
   */
  async updateSubscription(subscriptionId: string, priceId: string): Promise<SubscriptionResponse> {
    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId, priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            message: errorData.message || 'Erro ao atualizar assinatura',
            code: errorData.code,
          },
        };
      }

      const { subscriptionId: updatedId, status } = await response.json();
      
      return {
        success: true,
        subscriptionId: updatedId,
        status,
      };
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      return {
        success: false,
        error: {
          message: 'Erro interno do servidor',
        },
      };
    }
  }

  /**
   * Obtém o histórico de pagamentos de um cliente
   */
  async getPaymentHistory(customerId: string): Promise<PaymentHistoryItem[]> {
    try {
      const response = await fetch(`/api/stripe/payment-history/${customerId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao obter histórico de pagamentos');
      }

      const payments = await response.json();
      return payments;
    } catch (error) {
      console.error('Erro ao obter histórico de pagamentos:', error);
      return [];
    }
  }

  /**
   * Obtém as faturas de um cliente
   */
  async getInvoices(customerId: string): Promise<InvoiceData[]> {
    try {
      const response = await fetch(`/api/stripe/invoices/${customerId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao obter faturas');
      }

      const invoices = await response.json();
      return invoices;
    } catch (error) {
      console.error('Erro ao obter faturas:', error);
      return [];
    }
  }

  /**
   * Cria um portal de cobrança para o cliente
   */
  async createBillingPortal(customerId: string, returnUrl?: string): Promise<string | null> {
    try {
      const response = await fetch('/api/stripe/create-billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId, returnUrl }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar portal de cobrança');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Erro ao criar portal de cobrança:', error);
      return null;
    }
  }

  /**
   * Sincroniza dados do Stripe com o Supabase
   */
  async syncWithSupabase(userId: string, stripeData: Partial<SupabaseStripeSync>): Promise<void> {
    try {
      const { error } = await supabase
        .from('stripe_sync')
        .upsert({
          user_id: userId,
          ...stripeData,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao sincronizar com Supabase:', error);
      throw error;
    }
  }

  /**
   * Obtém dados sincronizados do Supabase
   */
  async getSupabaseSync(userId: string): Promise<SupabaseStripeSync | null> {
    try {
      const { data, error } = await supabase
        .from('stripe_sync')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter dados sincronizados:', error);
      return null;
    }
  }

  /**
   * Valida se o Stripe está inicializado
   */
  isReady(): boolean {
    return this.isInitialized && this.stripe !== null;
  }

  /**
   * Obtém a instância do Stripe
   */
  getStripe(): Stripe | null {
    return this.stripe;
  }

  /**
   * Limpa a instância do Stripe (útil para testes)
   */
  clear(): void {
    this.stripe = null;
    this.isInitialized = false;
  }
}

// Exporta uma instância singleton
export const stripeService = new StripeService();

// Exporta a classe para casos onde múltiplas instâncias são necessárias
export { StripeService }; 