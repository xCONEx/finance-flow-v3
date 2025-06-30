import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Função utilitária para obter limites do plano
function getPlanLimits(plan: string) {
  switch (plan) {
    case 'basic':
    case 'premium':
    case 'enterprise':
    case 'enterprise-annual':
      return { maxJobs: -1 } // Ilimitado
    default:
      return { maxJobs: 5 } // Plano free
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, jobData } = await req.json()
    if (!user_id || !jobData) {
      return new Response(JSON.stringify({ error: 'user_id e jobData são obrigatórios' }), { status: 400, headers: corsHeaders })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription')
      .eq('id', user_id)
      .single()
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), { status: 404, headers: corsHeaders })
    }

    const plan = profile.subscription || 'free'
    const { maxJobs } = getPlanLimits(plan)

    // Buscar uso atual
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: usage, error: usageError } = await supabase
      .from('user_usage_tracking')
      .select('count')
      .eq('user_id', user_id)
      .eq('usage_type', 'job')
      .eq('reset_date', currentMonth)
      .single()
    if (usageError && usageError.code !== 'PGRST116') {
      return new Response(JSON.stringify({ error: 'Erro ao buscar uso' }), { status: 500, headers: corsHeaders })
    }
    const jobsCount = usage?.count || 0

    if (maxJobs !== -1 && jobsCount >= maxJobs) {
      return new Response(JSON.stringify({ error: 'Limite de jobs do plano atingido' }), { status: 403, headers: corsHeaders })
    }

    // Criar job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({ ...jobData, user_id })
      .select()
      .single()
    if (jobError) {
      return new Response(JSON.stringify({ error: 'Erro ao criar job', details: jobError.message }), { status: 500, headers: corsHeaders })
    }

    // Incrementar uso
    if (usage) {
      await supabase
        .from('user_usage_tracking')
        .update({ count: jobsCount + 1, updated_at: new Date().toISOString() })
        .eq('id', usage.id)
    } else {
      await supabase
        .from('user_usage_tracking')
        .insert({ user_id, usage_type: 'job', count: 1, reset_date: currentMonth })
    }

    return new Response(JSON.stringify({ success: true, job }), { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('Erro na função create-job-with-limit:', error)
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), { status: 500, headers: corsHeaders })
  }
}) 