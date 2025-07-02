import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações da Kiwify
const KIWIFY_WEBHOOK_KEY = Deno.env.get('KIWIFY_WEBHOOK_KEY') || ''

const PLAN_MAPPING = {
  'jtksckF': 'basic',     // https://pay.kiwify.com.br/jtksckF
  'kTs280h': 'premium',   // https://pay.kiwify.com.br/kTs280h
  'iuQVR8a': 'enterprise', // https://pay.kiwify.com.br/iuQVR8a
  'CjaLdBJ': 'enterprise-annual' // https://pay.kiwify.com.br/CjaLdBJ
} as const

interface KiwifyWebhookPayload {
  event: string
  data: {
    id: string
    status: string
    plan_id: string
    customer_email: string
    amount: number
    currency: string
    created_at: string
    updated_at: string
    expires_at?: string
    trial_days?: number
    metadata?: Record<string, any>
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validar webhook
    const webhookKey = req.headers.get('x-webhook-key') || req.headers.get('authorization')
    if (webhookKey !== KIWIFY_WEBHOOK_KEY) {
      console.error('Webhook Kiwify não autorizado:', webhookKey)
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Parse do payload
    const payload: KiwifyWebhookPayload = await req.json()
    console.log('📦 Webhook Kiwify recebido:', JSON.stringify(payload, null, 2))

    const { event, data } = payload

    // Buscar usuário pelo email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      console.error('Erro ao buscar usuários:', userError)
      throw userError
    }

    const user = userData.users.find(u => u.email === data.customer_email)
    if (!user) {
      console.error('Usuário não encontrado:', data.customer_email)
      return new Response('User not found', { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    console.log('👤 Usuário encontrado:', user.id, user.email)

    // Preparar dados da assinatura
    const subscriptionData = {
      plan: PLAN_MAPPING[data.plan_id as keyof typeof PLAN_MAPPING] || 'basic',
      payment_provider: 'kiwify',
      external_subscription_id: data.id,
      external_customer_id: data.customer_email,
      amount: data.amount,
      currency: data.currency || 'BRL',
      current_period_start: data.created_at,
      metadata: {
        kiwify_event: event,
        kiwify_data: data
      }
    }

    // Processar eventos
    switch (event) {
      case 'payment.success':
      case 'subscription.activated':
      case 'subscription.renewed': {
        // Calcular data de expiração (30 dias para mensal, 365 para anual)
        const isAnnual = data.plan_id === 'CjaLdBJ'
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + (isAnnual ? 365 : 30))

        const activeSubscriptionData = {
          ...subscriptionData,
          status: 'active',
          current_period_end: data.expires_at || expirationDate.toISOString(),
          activated_at: new Date().toISOString()
        }

        // Atualizar perfil do usuário
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription: activeSubscriptionData.plan,
            subscription_data: activeSubscriptionData,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Erro ao atualizar assinatura:', updateError)
          throw updateError
        }

        console.log('✅ Assinatura ativada:', activeSubscriptionData.plan)
        break
      }

      case 'payment.failed':
      case 'subscription.cancelled':
      case 'subscription.expired': {
        const cancelledSubscriptionData = {
          ...subscriptionData,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: event
        }

        // Downgrade para plano gratuito
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription: 'free',
            subscription_data: cancelledSubscriptionData,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Erro ao cancelar assinatura:', updateError)
          throw updateError
        }

        console.log('❌ Assinatura cancelada/expirada')
        break
      }

      case 'subscription.trial_started': {
        const trialData = {
          ...subscriptionData,
          status: 'trialing',
          trial_end: data.expires_at || new Date(Date.now() + (data.trial_days || 7) * 24 * 60 * 60 * 1000).toISOString(),
          trial_started_at: new Date().toISOString()
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription: trialData.plan,
            subscription_data: trialData,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Erro ao iniciar trial:', updateError)
          throw updateError
        }

        console.log('🎯 Trial iniciado:', trialData.plan)
        break
      }

      default:
        console.log('📋 Evento não implementado:', event)
    }

    // Resposta de sucesso
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook Kiwify processado com sucesso',
        event,
        user_id: user.id
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Erro no webhook Kiwify:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}) 