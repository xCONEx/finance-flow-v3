// Utilitário para armazenamento seguro de credenciais
// Usa criptografia para proteger dados sensíveis no localStorage

const ENCRYPTION_KEY = 'financeflow_secure_key_2024';
const IV_LENGTH = 16;

// Função para gerar chave de criptografia
const generateKey = async (password: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('financeflow_salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

// Função para criptografar dados
const encrypt = async (data: string): Promise<string> => {
  try {
    const key = await generateKey(ENCRYPTION_KEY);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combinar IV e dados criptografados
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw new Error('Falha na criptografia');
  }
};

// Função para descriptografar dados
const decrypt = async (encryptedData: string): Promise<string> => {
  try {
    const key = await generateKey(ENCRYPTION_KEY);
    const decoder = new TextDecoder();
    
    // Converter de base64 para Uint8Array
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    // Separar IV e dados criptografados
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia');
  }
};

// Interface para dados de credenciais
interface Credentials {
  email: string;
  password: string;
  rememberMe: boolean;
  lastLogin: string;
}

// Classe para gerenciamento seguro de credenciais
export class SecureStorage {
  private static instance: SecureStorage;
  private readonly STORAGE_KEY = 'ff_secure_credentials';

  private constructor() {}

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  // Salvar credenciais de forma segura
  async saveCredentials(credentials: Credentials): Promise<void> {
    try {
      const encryptedData = await encrypt(JSON.stringify(credentials));
      localStorage.setItem(this.STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      throw new Error('Falha ao salvar credenciais');
    }
  }

  // Recuperar credenciais
  async getCredentials(): Promise<Credentials | null> {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) return null;

      const decryptedData = await decrypt(encryptedData);
      const credentials: Credentials = JSON.parse(decryptedData);

      // Verificar se as credenciais não expiraram (7 dias)
      const lastLogin = new Date(credentials.lastLogin);
      const now = new Date();
      const daysDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 7) {
        this.clearCredentials();
        return null;
      }

      return credentials;
    } catch (error) {
      console.error('Erro ao recuperar credenciais:', error);
      this.clearCredentials();
      return null;
    }
  }

  // Limpar credenciais
  clearCredentials(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      // Limpar também dados antigos não criptografados
      localStorage.removeItem('saved_email');
      localStorage.removeItem('saved_password');
    } catch (error) {
      console.error('Erro ao limpar credenciais:', error);
    }
  }

  // Verificar se há credenciais salvas
  hasCredentials(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  // Atualizar timestamp de último login
  async updateLastLogin(): Promise<void> {
    try {
      const credentials = await this.getCredentials();
      if (credentials) {
        credentials.lastLogin = new Date().toISOString();
        await this.saveCredentials(credentials);
      }
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
    }
  }
}

// Funções utilitárias para compatibilidade com código existente
export const secureStorage = SecureStorage.getInstance();

// Função para migrar credenciais antigas para o novo formato
export const migrateOldCredentials = async (): Promise<void> => {
  try {
    const oldEmail = localStorage.getItem('saved_email');
    const oldPassword = localStorage.getItem('saved_password');

    if (oldEmail && oldPassword) {
      const credentials: Credentials = {
        email: oldEmail,
        password: oldPassword,
        rememberMe: true,
        lastLogin: new Date().toISOString()
      };

      await secureStorage.saveCredentials(credentials);
      
      // Limpar dados antigos
      localStorage.removeItem('saved_email');
      localStorage.removeItem('saved_password');
      
      console.log('✅ Credenciais migradas com sucesso');
    }
  } catch (error) {
    console.error('Erro ao migrar credenciais:', error);
  }
};

// Função para verificar se o navegador suporta criptografia
export const isCryptoSupported = (): boolean => {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof TextEncoder !== 'undefined' &&
    typeof TextDecoder !== 'undefined'
  );
};

// Fallback para navegadores sem suporte a criptografia
export const fallbackStorage = {
  saveCredentials: (credentials: Credentials): void => {
    if (credentials.rememberMe) {
      localStorage.setItem('saved_email', credentials.email);
      // Não salvar senha em texto plano como fallback
      console.warn('Criptografia não suportada - credenciais não salvas');
    }
  },

  getCredentials: (): Credentials | null => {
    const email = localStorage.getItem('saved_email');
    if (email) {
      return {
        email,
        password: '',
        rememberMe: true,
        lastLogin: new Date().toISOString()
      };
    }
    return null;
  },

  clearCredentials: (): void => {
    localStorage.removeItem('saved_email');
    localStorage.removeItem('saved_password');
  },

  hasCredentials: (): boolean => {
    return localStorage.getItem('saved_email') !== null;
  }
}; 