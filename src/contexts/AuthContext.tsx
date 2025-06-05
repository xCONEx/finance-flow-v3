
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { firestoreService, FirestoreUser } from '../services/firestore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loading: boolean;
  userData: FirestoreUser | null;
  agencyData: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [agencyData, setAgencyData] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('🔄 Usuário autenticado, carregando dados...', firebaseUser.uid);
          
          // Verificar se o usuário existe na coleção 'usuarios'
          let userData = await firestoreService.getUserData(firebaseUser.uid);
          
          // Se não existir, criar um novo documento
          if (!userData) {
            console.log('👤 Criando novo usuário na coleção usuarios...');
            const newUserData: FirestoreUser = {
              email: firebaseUser.email || '',
              uid: firebaseUser.uid,
              logobase64: '',
              equipaments: [],
              expenses: [],
              jobs: [],
              routine: {
                dailyHours: 8,
                dalilyValue: 0,
                desiredSalary: 0,
                workDays: 22
              }
            };
            
            await firestoreService.createUser(newUserData);
            userData = newUserData;
            console.log('✅ Usuário criado com dados padrão');
          } else {
            console.log('📦 Dados do usuário encontrados:', {
              equipaments: userData.equipaments?.length || 0,
              expenses: userData.expenses?.length || 0,
              jobs: userData.jobs?.length || 0,
              routine: userData.routine
            });
          }

          // Verificar se o usuário pertence a uma agência
          console.log('🏢 Verificando se usuário pertence a uma agência...');
          const userAgency = await firestoreService.getUserAgency(firebaseUser.uid);
          
          if (userAgency) {
            console.log('🏢 Usuário encontrado em agência:', userAgency.id);
            console.log('📦 Dados da agência carregados:', {
              equipaments: userAgency.equipaments?.length || 0,
              expenses: userAgency.expenses?.length || 0,
              jobs: userAgency.jobs?.length || 0,
              colaboradores: userAgency.colaboradores?.length || 0
            });
            setAgencyData(userAgency);
          } else {
            console.log('👤 Usuário individual (não pertence a agência)');
            setAgencyData(null);
          }

          // Converter para o formato do contexto
          const appUser: User = {
            id: firebaseUser.uid,
            email: userData.email,
            name: firebaseUser.displayName || userData.email.split('@')[0],
            userType: userAgency ? 'employee' : 'individual',
            createdAt: new Date().toISOString()
          };

          setUser(appUser);
          setUserData(userData);

          console.log('✅ Dados do usuário carregados com sucesso!');

        } catch (error) {
          console.error('❌ Erro ao carregar dados do usuário:', error);
        }
      } else {
        console.log('👋 Usuário não autenticado');
        setUser(null);
        setUserData(null);
        setAgencyData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Iniciando login...');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      console.log('🔐 Iniciando login com Google...');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('❌ Erro no login com Google:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('📝 Criando nova conta...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Criar documento do usuário na coleção 'usuarios'
      const newUserData: FirestoreUser = {
        email: email,
        uid: userCredential.user.uid,
        logobase64: '',
        equipaments: [],
        expenses: [],
        jobs: [],
        routine: {
          dailyHours: 8,
          dalilyValue: 0,
          desiredSalary: 0,
          workDays: 22
        }
      };

      await firestoreService.createUser(newUserData);
      console.log('✅ Conta criada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('👋 Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      logout,
      register,
      loading,
      userData,
      agencyData
    }}>
      {children}
    </AuthContext.Provider>
  );
};
