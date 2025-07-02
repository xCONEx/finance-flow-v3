import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Configurações da Cakto
const CAKTO_WEBHOOK_KEY = Deno.env.get('CAKTO_WEBHOOK_KEY') || '';
const PLAN_MAPPING = {
  'yppzpjc': 'basic',
  'kesq5cb': 'premium',
  '34p727v': 'enterprise',
  'uoxtt9o': 'enterprise-annual' // anual
};
serve(async (req)=>{
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const headers = Object.fromEntries(req.headers.entries());
    const webhookKey = headers['x-webhook-key'] || headers['authorization'];
    if (webhookKey !== CAKTO_WEBHOOK_KEY) {
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders
      });
    }
    let payload;
    try {
      payload = await req.json();
    } catch  {
      return new Response('Invalid JSON', {
        status: 400,
        headers: corsHeaders
      });
    }
    console.log('📦 Payload recebido da Cakto:', JSON.stringify(payload, null, 2));
    const { event, data } = payload;
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Erro ao buscar usuários:', userError);
      throw userError;
    }
    const user = userData.users.find((u)=>u.email === data.customer_email);
    if (!user) {
      console.error('Usuário não encontrado:', data.customer_email);
      return new Response('User not found', {
        status: 404,
        headers: corsHeaders
      });
    }
    const subscriptionData = {
      plan: PLAN_MAPPING[data.plan_id] || 'basic',
      payment_provider: 'cakto',
      external_subscription_id: data.id,
      external_customer_id: data.customer_email,
      amount: data.amount,
      currency: data.currency || 'BRL',
      current_period_start: data.created_at,
      metadata: {
        cakto_event: event,
        cakto_data: data
      }
    };
    switch(event){
      case 'pagamento.aprovado':
      case 'assinatura.ativada':
      case 'assinatura.renovada':
        {
          const isAnnual = data.plan_id === 'uoxtt9o';
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + (isAnnual ? 365 : 30));
          const activeSubscriptionData = {
            ...subscriptionData,
            status: 'active',
            current_period_end: data.expires_at || expirationDate.toISOString(),
            activated_at: new Date().toISOString()
          };
          const { error: updateError } = await supabase.from('profiles').update({
            subscription: activeSubscriptionData.plan,
            subscription_data: activeSubscriptionData,
            updated_at: new Date().toISOString()
          }).eq('id', user.id);
          if (updateError) {
            console.error('Erro ao ativar assinatura:', updateError);
            throw updateError;
          }
          console.log('✅ Assinatura ativada:', activeSubscriptionData.plan);
          break;
        }
      case 'pagamento.recusado':
      case 'chargeback':
      case 'assinatura.cancelada':
      case 'assinatura.expirada':
        {
          const cancelledSubscriptionData = {
            ...subscriptionData,
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancel_reason: event
          };
          const { error: updateError } = await supabase.from('profiles').update({
            subscription: 'free',
            subscription_data: cancelledSubscriptionData,
            updated_at: new Date().toISOString()
          }).eq('id', user.id);
          if (updateError) {
            console.error('Erro ao cancelar assinatura:', updateError);
            throw updateError;
          }
          console.log('❌ Assinatura cancelada/expirada');
          break;
        }
      case 'assinatura.trial_iniciada':
        {
          const trialData = {
            ...subscriptionData,
            status: 'trialing',
            trial_end: data.expires_at || new Date(Date.now() + (data.trial_days || 7) * 24 * 60 * 60 * 1000).toISOString(),
            trial_started_at: new Date().toISOString()
          };
          const { error: updateError } = await supabase.from('profiles').update({
            subscription: trialData.plan,
            subscription_data: trialData,
            updated_at: new Date().toISOString()
          }).eq('id', user.id);
          if (updateError) {
            console.error('Erro ao iniciar trial:', updateError);
            throw updateError;
          }
          console.log('🎯 Trial iniciado:', trialData.plan);
          break;
        }
      default:
        console.log('📋 Evento não tratado:', event);
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processado com sucesso',
      event,
      user_id: user.id
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
