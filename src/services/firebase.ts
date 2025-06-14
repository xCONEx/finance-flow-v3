
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Adicione sua configuração do Firebase aqui
    apiKey: "AIzaSyAIO4Qo-kuobCIpRh-XTye5Fs_-9uZmzlY",
    authDomain: "financeflow-e0fae.firebaseapp.com",
    projectId: "financeflow-e0fae",
    storageBucket: "financeflow-e0fae.firebasestorage.app",
    messagingSenderId: "970984329138",
    appId: "1:970984329138:web:429a185b8bab1971991eab"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Função para forçar atualização do token com claims atualizados
export const forceTokenRefresh = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await user.getIdToken(true); // força refresh do token
      console.log('🔄 Token atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar token:', error);
    }
  }
};

export default app;
