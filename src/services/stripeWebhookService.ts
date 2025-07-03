import Stripe from 'stripe';
import { supabase } from '../integrations/supabase/client';
import { notificationService } from './notificationService';
import { PaymentNotification, TransactionLog } from '../types/stripe';

class StripeWebhookService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || import.meta.env.VITE_STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('Stripe secret key não configurada');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-06-30.basil',
    });
  }

  /**
   * Processa eventos de webhook do Stripe
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      console.log(`Processando evento Stripe: ${event.type}`);

      // Log da transação
      await this.logTransaction(event);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.created':
          await this.handleCustomerCreated(event.data.object as Stripe.Customer);
          break;

        case 'customer.updated':
          await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
          break;

        default:
          console.log(`Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  /**
   * Processa pagamento bem-sucedido
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const customerId = paymentIntent.customer as string;
      const amount = paymentIntent.amount / 100; // Converte de centavos
      const currency = paymentIntent.currency.toUpperCase();

      // Atualiza dados do usuário no Supabase
      await this.updateUserPaymentStatus(customerId, 'active');

      // Envia notificação de sucesso
      await this.sendPaymentNotification({
        type: 'payment_success',
        userId: customerId,
        data: {
          amount,
          currency,
          paymentIntentId: paymentIntent.id,
        },
        timestamp: Date.now(),
      });

      console.log(`Pagamento bem-sucedido: ${paymentIntent.id}`);
    } catch (error) {
      console.error('Erro ao processar pagamento bem-sucedido:', error);
      throw error;
    }
  }

  /**
   * Processa pagamento falhado
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const customerId = paymentIntent.customer as string;
      const amount = paymentIntent.amount / 100;
      const currency = paymentIntent.currency.toUpperCase();

      // Atualiza status do pagamento
      await this.updateUserPaymentStatus(customerId, 'failed');

      // Envia notificação de falha
      await this.sendPaymentNotification({
        type: 'payment_failed',
        userId: customerId,
        data: {
          amount,
          currency,
          paymentIntentId: paymentIntent.id,
        },
        timestamp: Date.now(),
      });

      console.log(`Pagamento falhou: ${paymentIntent.id}`);
    } catch (error) {
      console.error('Erro ao processar pagamento falhado:', error);
      throw error;
    }
  }

  /**
   * Processa criação de assinatura
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customerId = subscription.customer as string;
      const subscriptionId = subscription.id;

      // Sincroniza dados da assinatura com Supabase
      await this.syncSubscriptionData(customerId, subscription);

      // Envia notificação de assinatura criada
      await this.sendPaymentNotification({
        type: 'subscription_created',
        userId: customerId,
        data: {
          subscriptionId,
        },
        timestamp: Date.now(),
      });

      console.log(`Assinatura criada: ${subscriptionId}`);
    } catch (error) {
      console.error('Erro ao processar criação de assinatura:', error);
      throw error;
    }
  }

  /**
   * Processa atualização de assinatura
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customerId = subscription.customer as string;
      const subscriptionId = subscription.id;

      // Atualiza dados da assinatura no Supabase
      await this.syncSubscriptionData(customerId, subscription);

      console.log(`Assinatura atualizada: ${subscriptionId}`);
    } catch (error) {
      console.error('Erro ao processar atualização de assinatura:', error);
      throw error;
    }
  }

  /**
   * Processa cancelamento de assinatura
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customerId = subscription.customer as string;
      const subscriptionId = subscription.id;

      // Atualiza status da assinatura no Supabase
      await this.updateSubscriptionStatus(customerId, 'cancelled');

      // Envia notificação de cancelamento
      await this.sendPaymentNotification({
        type: 'subscription_cancelled',
        userId: customerId,
        data: {
          subscriptionId,
        },
        timestamp: Date.now(),
      });

      console.log(`Assinatura cancelada: ${subscriptionId}`);
    } catch (error) {
      console.error('Erro ao processar cancelamento de assinatura:', error);
      throw error;
    }
  }

  /**
   * Processa fatura paga com sucesso
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      const customerId = invoice.customer as string;

      // Atualiza status da fatura
      await this.updateInvoiceStatus(invoice.id, 'paid');

      console.log(`Fatura paga: ${invoice.id}`);
    } catch (error) {
      console.error('Erro ao processar fatura paga:', error);
      throw error;
    }
  }

  /**
   * Processa falha no pagamento da fatura
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const customerId = invoice.customer as string;

      // Atualiza status da fatura
      await this.updateInvoiceStatus(invoice.id, 'failed');

      // Envia notificação de falha no pagamento
      await this.sendPaymentNotification({
        type: 'payment_failed',
        userId: customerId,
        data: {},
        timestamp: Date.now(),
      });

      console.log(`Falha no pagamento da fatura: ${invoice.id}`);
    } catch (error) {
      console.error('Erro ao processar falha na fatura:', error);
      throw error;
    }
  }

  /**
   * Processa criação de cliente
   */
  private async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    try {
      // Sincroniza dados do cliente com Supabase
      await this.syncCustomerData(customer);

      console.log(`Cliente criado: ${customer.id}`);
    } catch (error) {
      console.error('Erro ao processar criação de cliente:', error);
      throw error;
    }
  }

  /**
   * Processa atualização de cliente
   */
  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
    try {
      // Atualiza dados do cliente no Supabase
      await this.syncCustomerData(customer);

      console.log(`Cliente atualizado: ${customer.id}`);
    } catch (error) {
      console.error('Erro ao processar atualização de cliente:', error);
      throw error;
    }
  }

  /**
   * Sincroniza dados da assinatura com Supabase
   */
  private async syncSubscriptionData(customerId: string, subscription: Stripe.Subscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('stripe_sync')
        .upsert({
          user_id: customerId,
          stripe_customer_id: customerId,
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          current_period_start: (subscription as any).current_period_start || null,
          current_period_end: (subscription as any).current_period_end || null,
          cancel_at_period_end: (subscription as any).cancel_at_period_end || false,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados da assinatura:', error);
      throw error;
    }
  }

  /**
   * Atualiza status do pagamento do usuário
   */
  private async updateUserPaymentStatus(customerId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          payment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza status da assinatura
   */
  private async updateSubscriptionStatus(customerId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('stripe_sync')
        .update({
          subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', customerId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar status da assinatura:', error);
      throw error;
    }
  }

  /**
   * Atualiza status da fatura
   */
  private async updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('stripe_invoices')
        .upsert({
          invoice_id: invoiceId,
          status,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar status da fatura:', error);
      throw error;
    }
  }

  /**
   * Sincroniza dados do cliente
   */
  private async syncCustomerData(customer: Stripe.Customer): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          stripe_customer_id: customer.id,
          email: customer.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.metadata.user_id || customer.email);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados do cliente:', error);
      throw error;
    }
  }

  /**
   * Envia notificação de pagamento
   */
  private async sendPaymentNotification(notification: PaymentNotification): Promise<void> {
    try {
      await notificationService.showNotification({
        id: `stripe-${notification.timestamp}`,
        userId: notification.userId,
        type: 'system_alert',
        title: this.getNotificationTitle(notification.type),
        body: this.getNotificationMessage(notification.type, notification.data),
        data: notification.data,
        timestamp: notification.timestamp,
        isRead: false,
        priority: 'medium',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de pagamento:', error);
    }
  }

  /**
   * Obtém título da notificação
   */
  private getNotificationTitle(type: string): string {
    switch (type) {
      case 'payment_success':
        return 'Pagamento Confirmado';
      case 'payment_failed':
        return 'Falha no Pagamento';
      case 'subscription_created':
        return 'Assinatura Ativada';
      case 'subscription_cancelled':
        return 'Assinatura Cancelada';
      default:
        return 'Notificação de Pagamento';
    }
  }

  /**
   * Obtém mensagem da notificação
   */
  private getNotificationMessage(type: string, data: any): string {
    switch (type) {
      case 'payment_success':
        return `Seu pagamento de R$ ${data.amount} foi processado com sucesso!`;
      case 'payment_failed':
        return 'Houve um problema com seu pagamento. Verifique seus dados e tente novamente.';
      case 'subscription_created':
        return 'Sua assinatura foi ativada com sucesso!';
      case 'subscription_cancelled':
        return 'Sua assinatura foi cancelada. Você ainda tem acesso até o final do período atual.';
      default:
        return 'Você recebeu uma notificação sobre seu pagamento.';
    }
  }

  /**
   * Registra transação no log
   */
  private async logTransaction(event: Stripe.Event): Promise<void> {
    try {
      const log: TransactionLog = {
        id: event.id,
        type: this.getTransactionType(event.type),
        status: 'success',
        data: event.data.object,
        timestamp: event.created,
        userId: this.extractUserId(event),
      };

      const { error } = await supabase
        .from('transaction_logs')
        .insert(log);

      if (error) {
        console.error('Erro ao registrar log de transação:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar log de transação:', error);
    }
  }

  /**
   * Obtém tipo da transação
   */
  private getTransactionType(eventType: string): 'payment' | 'subscription' | 'refund' | 'webhook' {
    if (eventType.includes('payment')) return 'payment';
    if (eventType.includes('subscription')) return 'subscription';
    if (eventType.includes('refund')) return 'refund';
    return 'webhook';
  }

  /**
   * Extrai ID do usuário do evento
   */
  private extractUserId(event: Stripe.Event): string | undefined {
    const obj = event.data.object as any;
    return obj.customer || obj.user_id || obj.metadata?.user_id;
  }
}

// Exporta uma instância singleton
export const stripeWebhookService = new StripeWebhookService();

// Exporta a classe para casos onde múltiplas instâncias são necessárias
export { StripeWebhookService }; 