
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface SubscriptionData {
  plan: 'free' | 'basic' | 'premium' | 'enterprise' | 'enterprise-annual';
  status: 'active' | 'cancelled' | 'expired';
  activated_at?: string;
  cancelled_at?: string;
  expires_at?: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    plan: 'free',
    status: 'active'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setSubscription({ plan: 'free', status: 'active' });
      setLoading(false);
      return;
    }

    // Escutar mudanças na assinatura do usuário
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.id),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const userSubscription = userData.subscription;
          
          if (userSubscription) {
            setSubscription(userSubscription);
          } else {
            setSubscription({ plan: 'free', status: 'active' });
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar assinatura:', error);
        setSubscription({ plan: 'free', status: 'active' });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const hasActiveSubscription = () => {
    return subscription.status === 'active' && subscription.plan !== 'free';
  };

  const canAccessFeature = (requiredPlan: string) => {
    const planHierarchy = {
      'free': 0,
      'basic': 1,
      'premium': 2,
      'enterprise': 3,
      'enterprise-annual': 3
    };

    const userPlanLevel = planHierarchy[subscription.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    return subscription.status === 'active' && userPlanLevel >= requiredPlanLevel;
  };

  return {
    subscription,
    loading,
    hasActiveSubscription,
    canAccessFeature,
    currentPlan: subscription.plan,
    isActive: subscription.status === 'active'
  };
};
