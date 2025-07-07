// Configuração dos Webhooks
export const WEBHOOK_CONFIG = {
  cakto: {
    key: '', // Será preenchido pela variável de ambiente
    url: 'https://elsilxqruurrbdebxndx.supabase.co/functions/v1/cakto-webhook'
  },
  kiwify: {
    key: '', // Será preenchido pela variável de ambiente
    url: 'https://elsilxqruurrbdebxndx.supabase.co/functions/v1/kiwify-webhook'
  }
} as const;

// Função para obter a chave do webhook
export const getWebhookKey = (provider: 'cakto' | 'kiwify'): string => {
  // Sempre pegar da variável de ambiente
  const envKey = provider === 'cakto' 
    ? import.meta.env.VITE_CAKTO_WEBHOOK_KEY
    : import.meta.env.VITE_KIWIFY_WEBHOOK_KEY;
  
  if (!envKey) {
    console.warn(`⚠️ Variável de ambiente VITE_${provider.toUpperCase()}_WEBHOOK_KEY não configurada`);
    return '';
  }
  
  return envKey;
};

// Função para obter a URL do webhook
export const getWebhookUrl = (provider: 'cakto' | 'kiwify'): string => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://elsilxqruurrbdebxndx.supabase.co';
  return `${baseUrl}/functions/v1/${provider}-webhook`;
}; 
