import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://pay.cakto.com.br',
  'https://finance.creatorlyhub.com.br',
  'https://creatorlyhub.com.br',
  'http://localhost:3000',
  'http://localhost:5173'
];

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  record.count++;
  return true;
}

function validateCORS(origin: string | null): boolean {
  if (!origin) return false;
  const normalizedOrigin = origin.replace(/\/$/, '');
  return ALLOWED_ORIGINS.some(allowed => {
    const normalizedAllowed = allowed.replace(/\/$/, '');
    return normalizedOrigin === normalizedAllowed ||
           normalizedOrigin.endsWith(normalizedAllowed.replace('https://', '')) ||
           normalizedOrigin.endsWith(normalizedAllowed.replace('http://', ''));
  });
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const isCorsValid = validateCORS(origin);
  const corsHeaders = {
    'Access-Control-Allow-Origin': isCorsValid ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  // Rate limiting por IP
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return new Response('Too Many Requests', { status: 429, headers: corsHeaders });
  }

  // Autenticação via Bearer token
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }
  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Recuperar usuário autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  // Ler corpo da requisição
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders });
  }

  if (!Array.isArray(body)) {
    return new Response(JSON.stringify({ error: 'Body must be an array of clients' }), { status: 400, headers: corsHeaders });
  }

  // Campos obrigatórios
  const requiredFields = ['name', 'email'];
  const results = [];

  for (const client of body) {
    const missing = requiredFields.filter(f => !client[f] || String(client[f]).trim() === '');
    if (missing.length > 0) {
      results.push({ email: client.email, status: 'skipped', reason: `Missing fields: ${missing.join(', ')}` });
      continue;
    }
    // Verifica duplicidade
    const { data: existing, error: findError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', client.email)
      .maybeSingle();
    if (findError) {
      results.push({ email: client.email, status: 'error', reason: findError.message });
      continue;
    }
    if (existing) {
      // Atualiza
      const { error: updateError } = await supabase
        .from('clients')
        .update({ ...client })
        .eq('id', existing.id);
      if (updateError) {
        results.push({ email: client.email, status: 'error', reason: updateError.message });
      } else {
        results.push({ email: client.email, status: 'updated' });
      }
    } else {
      // Insere
      const { error: insertError } = await supabase
        .from('clients')
        .insert([{ ...client, user_id: user.id, user_email: user.email }]);
      if (insertError) {
        results.push({ email: client.email, status: 'error', reason: insertError.message });
      } else {
        results.push({ email: client.email, status: 'inserted' });
      }
    }
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}); 