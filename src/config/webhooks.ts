// Configuração dos Webhooks
export const WEBHOOK_CONFIG = {
  cakto: {
    key: '27a5317b-248f-47e8-9c4b-70aff176e556',
    url: 'https://elsilxqruurrbdebxndx.supabase.co/functions/v1/cakto-webhook'
  },
  kiwify: {
    key: 'v4x4jy8w3lf',
    url: 'https://elsilxqruurrbdebxndx.supabase.co/functions/v1/kiwify-webhook'
  }
} as const;

// Função para obter a chave do webhook
export const getWebhookKey = (provider: 'cakto' | 'kiwify'): string => {
  // Primeiro tenta pegar da variável de ambiente
  const envKey = provider === 'cakto' 
    ? import.meta.env.VITE_CAKTO_WEBHOOK_KEY
    : import.meta.env.VITE_KIWIFY_WEBHOOK_KEY;
  
  // Se não estiver configurada, usa a chave hardcoded
  return envKey || WEBHOOK_CONFIG[provider].key;
};

// Função para obter a URL do webhook
export const getWebhookUrl = (provider: 'cakto' | 'kiwify'): string => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://elsilxqruurrbdebxndx.supabase.co';
  return `${baseUrl}/functions/v1/${provider}-webhook`;
}; 