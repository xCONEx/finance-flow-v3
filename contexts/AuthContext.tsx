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
              equipments: [],
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
              equipments: userData.equipments?.length || 0,
              expenses: userData.expenses?.length || 0,
              jobs: userData.jobs?.length || 0,
              routine: userData.routine
            });
          }

          // CORRIGIDO: Verificação mais robusta para proprietário da agência
          console.log('🏢 Verificando se usuário pertence a uma agência...');
          let userAgency = null;
          let userType: 'individual' | 'company_owner' | 'employee' | 'admin' = 'individual';
          
          try {
            // Buscar por agências onde o usuário é colaborador
            const allAgencies = await firestoreService.getAllAgencies();
            console.log('🔍 Verificando agências:', allAgencies.length);
            
            for (const agency of allAgencies) {
              const agencyData = agency as any; // Type assertion to avoid TypeScript errors
              
              console.log('🔍 Verificando agência:', agencyData.id, {
                ownerId: agencyData.ownerId,
                ownerUID: agencyData.ownerUID,
                owner: agencyData.owner,
                userUID: firebaseUser.uid,
                userEmail: firebaseUser.email
              });
              
              // CORRIGIDO: Verificar múltiplos campos possíveis para proprietário
              const isOwner = (
                (agencyData.ownerId && agencyData.ownerId === firebaseUser.uid) ||
                (agencyData.ownerUID && agencyData.ownerUID === firebaseUser.uid) ||
                (agencyData.owner && agencyData.owner === firebaseUser.uid) ||
                (agencyData.owner && agencyData.owner === firebaseUser.email) ||
                (agencyData.ownerId && agencyData.ownerId === firebaseUser.email)
              );
              
              if (isOwner) {
                userAgency = agencyData;
                userType = 'company_owner';
                console.log('👑 Usuário é DONO da agência:', agencyData.id);
                console.log('✅ Tipo identificado: PROPRIETÁRIO');
                break;
              }
              
              // Verificar se é colaborador
              if (agencyData.colaboradores && Array.isArray(agencyData.colaboradores)) {
                const isCollaborator = agencyData.colaboradores.some((colab: any) => 
                  colab.uid === firebaseUser.uid || colab.email === firebaseUser.email
                );
                
                if (isCollaborator) {
                  userAgency = agencyData;
                  userType = 'employee';
                  console.log('👥 Usuário é colaborador da agência:', agencyData.id);
                  break;
                }
              }
            }
            
            if (userAgency) {
              console.log('🏢 Usuário encontrado em agência:', userAgency.id);
              console.log('📦 Dados da agência carregados:', {
                equipments: userAgency.equipments?.length || 0,
                expenses: userAgency.expenses?.length || 0,
                jobs: userAgency.jobs?.length || 0,
                colaboradores: userAgency.colaboradores?.length || 0
              });
              setAgencyData(userAgency);
            } else {
              console.log('👤 Usuário individual (não pertence a agência)');
              setAgencyData(null);
            }
            
          } catch (error) {
            console.error('❌ Erro ao buscar agências:', error);
            setAgencyData(null);
          }

          // Verificar se é admin
          const isAdmin = firebaseUser.email === 'adm.financeflow@gmail.com';
          if (isAdmin) {
            userType = 'admin';
          }
          
          // Converter para o formato do contexto
          const appUser: User = {
            id: firebaseUser.uid,
            email: userData.email,
            name: firebaseUser.displayName || userData.email.split('@')[0],
            userType: userType,
            createdAt: new Date().toISOString(),
            photoURL: firebaseUser.photoURL || undefined
          };

          setUser(appUser);
          setUserData(userData);

          console.log('✅ Dados do usuário carregados com sucesso!');
          console.log('👤 Tipo de usuário FINAL:', userType);
          if (isAdmin) {
            console.log('👑 Usuário administrador identificado');
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
        equipments: [],
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
