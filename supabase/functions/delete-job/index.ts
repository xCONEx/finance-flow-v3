import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { job_id, user_id } = await req.json()
    
    if (!job_id || !user_id) {
      return new Response(JSON.stringify({ error: 'job_id e user_id são obrigatórios' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    console.log('🗑️ Deletando job:', { job_id, user_id })

    // Verificar se o job pertence ao usuário
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('id, user_id')
      .eq('id', job_id)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !job) {
      return new Response(JSON.stringify({ error: 'Job não encontrado ou não pertence ao usuário' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Deletar o job (sem decrementar contagem de uso)
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', job_id)
      .eq('user_id', user_id)

    if (deleteError) {
      console.error('❌ Erro ao deletar job:', deleteError)
      return new Response(JSON.stringify({ error: 'Erro ao deletar job', details: deleteError.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    console.log('✅ Job deletado com sucesso:', job_id)

    return new Response(JSON.stringify({ success: true, message: 'Job deletado com sucesso' }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("❌ Erro ao deletar job:", error)
    return new Response(JSON.stringify({ 
      error: error.message, 
      stack: error.stack,
      type: typeof error,
      details: error.toString()
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
}) 