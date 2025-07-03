import { useState, useEffect, useCallback } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { stripeService } from '../services/stripeService';
import {
  UseStripeReturn,
  PaymentData,
  PaymentResponse,
  SubscriptionData,
  SubscriptionResponse,
  PaymentHistoryItem,
  InvoiceData,
  StripeElementsOptions
} from '../types/stripe';

export const useStripe = (): UseStripeReturn => {
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        setLoading(true);
        setError(null);

        const stripeInstance = await stripeService.initialize();
        setStripe(stripeInstance);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao inicializar Stripe');
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  // Criar Payment Intent
  const createPaymentIntent = useCallback(async (data: PaymentData): Promise<PaymentResponse> => {
    try {
      setError(null);
      const response = await stripeService.createPaymentIntent(data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar payment intent';
      setError(errorMessage);
      return {
        success: false,
        error: { message: errorMessage }
      };
    }
  }, []);

  // Criar assinatura
  const createSubscription = useCallback(async (data: SubscriptionData): Promise<SubscriptionResponse> => {
    try {
      setError(null);
      const response = await stripeService.createSubscription(data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar assinatura';
      setError(errorMessage);
      return {
        success: false,
        error: { message: errorMessage }
      };
    }
  }, []);

  // Cancelar assinatura
  const cancelSubscription = useCallback(async (subscriptionId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await stripeService.cancelSubscription(subscriptionId);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar assinatura';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Obter histórico de pagamentos
  const getPaymentHistory = useCallback(async (): Promise<PaymentHistoryItem[]> => {
    try {
      setError(null);
      // Aqui você precisaria passar o customerId, que pode vir do contexto do usuário
      const customerId = 'customer-id'; // Implementar lógica para obter customerId
      const payments = await stripeService.getPaymentHistory(customerId);
      return payments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter histórico de pagamentos';
      setError(errorMessage);
      return [];
    }
  }, []);

  // Obter faturas
  const getInvoices = useCallback(async (): Promise<InvoiceData[]> => {
    try {
      setError(null);
      // Aqui você precisaria passar o customerId, que pode vir do contexto do usuário
      const customerId = 'customer-id'; // Implementar lógica para obter customerId
      const invoices = await stripeService.getInvoices(customerId);
      return invoices;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter faturas';
      setError(errorMessage);
      return [];
    }
  }, []);

  return {
    stripe,
    elements,
    loading,
    error,
    createPaymentIntent,
    createSubscription,
    cancelSubscription,
    getPaymentHistory,
    getInvoices,
  };
};

// Hook para configurar Elements do Stripe
export const useStripeElements = (stripe: any, clientSecret?: string, options?: StripeElementsOptions) => {
  const [elements, setElements] = useState<any>(null);

  useEffect(() => {
    if (clientSecret && stripe) {
      const elementsInstance = stripe.elements({
        clientSecret,
        appearance: options?.appearance || {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3b82f6',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
      });
      setElements(elementsInstance);
    }
  }, [stripe, clientSecret, options]);

  return elements;
};

// Hook para processar pagamento
export const usePaymentProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const processPayment = useCallback(async (
    stripe: any,
    elements: any,
    paymentData: PaymentData,
    onSuccess?: (paymentIntentId: string) => void,
    onError?: (error: string) => void
  ) => {
    if (!stripe || !elements) {
      const errorMsg = 'Stripe não inicializado';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      // Criar payment intent
      const paymentResponse = await stripeService.createPaymentIntent(paymentData);
      
      if (!paymentResponse.success || !paymentResponse.clientSecret) {
        throw new Error(paymentResponse.error?.message || 'Erro ao criar payment intent');
      }

      // Confirmar pagamento
      const { error: confirmError } = await stripe.confirmCardPayment(
        paymentResponse.clientSecret,
        {
          payment_method: {
            card: elements.getElement('card'),
            billing_details: {
              name: paymentData.metadata?.name || '',
              email: paymentData.metadata?.email || '',
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Erro ao confirmar pagamento');
      }

      setSuccess(true);
      onSuccess?.(paymentResponse.paymentIntentId!);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProcessing(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    processing,
    error,
    success,
    processPayment,
    reset,
  };
};

// Hook para gerenciar assinaturas
export const useSubscriptionManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = useCallback(async (
    customerId: string,
    priceId: string,
    paymentMethodId?: string,
    trialPeriodDays?: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      const subscriptionData: SubscriptionData = {
        customerId,
        priceId,
        metadata: {},
        trialPeriodDays,
      };

      const response = await stripeService.createSubscription(subscriptionData);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Erro ao criar assinatura');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar assinatura';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await stripeService.cancelSubscription(subscriptionId);
      
      if (!success) {
        throw new Error('Erro ao cancelar assinatura');
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar assinatura';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSubscription = useCallback(async (subscriptionId: string, priceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await stripeService.updateSubscription(subscriptionId, priceId);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Erro ao atualizar assinatura');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar assinatura';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createSubscription,
    cancelSubscription,
    updateSubscription,
  };
};

// Hook para portal de cobrança
export const useBillingPortal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPortalSession = useCallback(async (customerId: string, returnUrl?: string) => {
    setLoading(true);
    setError(null);

    try {
      const portalUrl = await stripeService.createBillingPortal(customerId, returnUrl);
      
      if (!portalUrl) {
        throw new Error('Erro ao criar sessão do portal de cobrança');
      }

      // Redirecionar para o portal
      window.location.href = portalUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar portal de cobrança';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createPortalSession,
  };
}; 