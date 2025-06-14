
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, forceTokenRefresh } from '../services/firebase';
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
          console.log('📧 Email do Firebase:', firebaseUser.email);
          
          await forceTokenRefresh();
          
          let userEmail = firebaseUser.email;
          if (!userEmail) {
            console.warn('⚠️ Email não disponível no Firebase Auth, tentando recarregar...');
            await firebaseUser.reload();
            userEmail = firebaseUser.email || '';
          }

          console.log('📧 Email final para salvar:', userEmail);
          
          // Buscar ou criar usuário
          let userData = await firestoreService.getUserData(firebaseUser.uid);
          
          if (!userData || !userData.email || userData.email !== userEmail) {
            console.log('👤 Criando/atualizando usuário na coleção usuarios...');
            const newUserData: FirestoreUser = {
              ...(userData || {}),
              email: userEmail || '',
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || userData?.name || userEmail?.split('@')[0] || '',
              logobase64: userData?.logobase64 || '',
              equipments: userData?.equipments || [],
              expenses: userData?.expenses || [],
              jobs: userData?.jobs || [],
              routine: userData?.routine || {
                dailyHours: 8,
                dalilyValue: 0,
                desiredSalary: 0,
                workDays: 22
              }
            };
            
            await firestoreService.createUser(newUserData);
            userData = newUserData;
            console.log('✅ Usuário criado/atualizado com email:', userEmail);
          } else {
            console.log('📦 Dados do usuário encontrados com email:', userData.email);
          }

          // Verificar se é admin
          const isAdmin = firebaseUser.email === 'adm.financeflow@gmail.com' || firebaseUser.email === 'yuriadrskt@gmail.com';
          let userType: 'individual' | 'company_owner' | 'employee' | 'admin' = 'individual';
          
          if (isAdmin) {
            userType = 'admin';
            console.log('👑 Usuário administrador identificado:', firebaseUser.email);
            
            // Atualizar role no banco se necessário
            if (userData.role !== 'admin') {
              await firestoreService.updateUserField(firebaseUser.uid, 'role', 'admin');
              userData.role = 'admin';
            }
          }

          // Buscar dados da agência usando novo método
          console.log('🏢 Verificando agência do usuário...');
          let userAgency = null;
          
          try {
            userAgency = await firestoreService.getUserAgencyData(firebaseUser.uid);
            
            if (userAgency) {
              console.log('🏢 Agência encontrada:', userAgency.id);
              console.log('👤 Role na agência:', userAgency.userRole);
              
              // Definir userType baseado no role
              if (userAgency.userRole === 'admin') {
                userType = 'admin';
              } else if (userAgency.userRole === 'owner') {
                userType = 'company_owner';
              } else if (userAgency.userRole === 'editor' || userAgency.userRole === 'viewer') {
                userType = 'employee';
              }
              
              setAgencyData(userAgency);
            } else if (!isAdmin) {
              console.log('👤 Usuário individual (não pertence a agência)');
              setAgencyData(null);
            } else {
              setAgencyData(null);
            }
            
          } catch (error) {
            console.error('❌ Erro ao buscar agência:', error);
            setAgencyData(null);
          }
          
          // Converter para o formato do contexto
          const appUser: User = {
            id: firebaseUser.uid,
            email: userData.email,
            name: firebaseUser.displayName || userData.name || userData.email.split('@')[0],
            userType: userType,
            createdAt: new Date().toISOString(),
            photoURL: firebaseUser.photoURL || undefined
          };

          setUser(appUser);
          setUserData(userData);

          console.log('✅ Dados do usuário carregados com sucesso!');
          console.log('👤 Tipo de usuário FINAL:', userType);
          console.log('📧 Email salvo no contexto:', userData.email);
          if (isAdmin) {
            console.log('👑 Usuário administrador confirmado com acesso total');
          }

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
      provider.addScope('email');
      provider.addScope('profile');
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
      
      const newUserData: FirestoreUser = {
        email: email,
        uid: userCredential.user.uid,
        name: name,
        logobase64: '',
        equipments: [],
        expenses: [],
        jobs: [],
        routine: {
          dailyHours: 8,
          dalilyValue: 0,
          desiredSalary: 0,
          workDays: 22
        },
        role: 'individual'
      };

      await firestoreService.createUser(newUserData);
      console.log('✅ Conta criada com sucesso com email:', email);
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

export default AuthProvider;
