
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

// Configurações do webhook Cakto
const CAKTO_WEBHOOK_KEY = '27a5317b-248f-47e8-9c4b-70aff176e556';

const PLAN_MAPPING = {
  'yppzpjc': 'basic',     // https://pay.cakto.com.br/yppzpjc
  'kesq5cb': 'premium',   // https://pay.cakto.com.br/kesq5cb
  '34p727v': 'enterprise', // https://pay.cakto.com.br/34p727v
  'uoxtt9o': 'enterprise-annual' // https://pay.cakto.com.br/uoxtt9o
};

interface CaktoWebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    plan_id: string;
    customer_email: string;
    amount: number;
    currency: string;
    created_at: string;
    updated_at: string;
  };
}

// Função para validar o webhook
const validateCaktoWebhook = (headers: any): boolean => {
  const webhookKey = headers['x-webhook-key'] || headers['authorization'];
  return webhookKey === CAKTO_WEBHOOK_KEY;
};

// Função para atualizar assinatura no Firestore
const updateUserSubscription = async (email: string, subscriptionData: any) => {
  try {
    logger.info('Atualizando assinatura para:', email, subscriptionData);
    
    const userQuery = await db.collection('users').where('email', '==', email).get();
    
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.update({
        subscription: subscriptionData,
        updatedAt: new Date()
      });
      
      logger.info('Assinatura atualizada com sucesso para:', email);
    } else {
      logger.warn('Usuário não encontrado:', email);
    }
  } catch (error) {
    logger.error('Erro ao atualizar assinatura:', error);
    throw error;
  }
};

// Função para processar eventos de pagamento
const processCaktoPayment = async (payload: CaktoWebhookPayload) => {
  logger.info('Processando webhook Cakto:', payload);
  
  const { event, data } = payload;
  
  switch (event) {
    case 'payment.success':
    case 'subscription.activated':
      await updateUserSubscription(data.customer_email, {
        plan: PLAN_MAPPING[data.plan_id as keyof typeof PLAN_MAPPING] || 'basic',
        status: 'active',
        activated_at: new Date().toISOString(),
        payment_id: data.id,
        amount: data.amount
      });
      break;
      
    case 'payment.failed':
    case 'subscription.cancelled':
      await updateUserSubscription(data.customer_email, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        payment_id: data.id
      });
      break;
      
    default:
      logger.warn('Evento não reconhecido:', event);
  }
};

// Cloud Function para receber o webhook da Cakto
export const caktoWebhook = onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-key');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    logger.info('Headers recebidos:', req.headers);
    logger.info('Body recebido:', req.body);
    
    if (!validateCaktoWebhook(req.headers)) {
      logger.warn('Webhook não autorizado');
      res.status(401).send('Unauthorized');
      return;
    }

    await processCaktoPayment(req.body);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Erro no webhook Cakto:', error);
    res.status(500).send('Internal Server Error');
  }
});
