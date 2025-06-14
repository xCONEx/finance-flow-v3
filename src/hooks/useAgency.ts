
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

export interface AgencyData {
  id: string;
  name?: string;
  createdBy?: string;
  userRole: 'admin' | 'owner' | 'editor' | 'viewer';
  equipments?: any[];
  expenses?: any[];
  jobs?: any[];
  kanbanBoard?: any;
}

export const useAgency = () => {
  const [agencyData, setAgencyData] = useState<AgencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadAgencyData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await firestoreService.getUserAgencyData(user.id);
      if (result) {
        setAgencyData(result as AgencyData);
      } else {
        setAgencyData(null);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar agência:', err);
      setError('Erro ao carregar dados da agência');
      setAgencyData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgencyData();
  }, [user]);

  return {
    agencyData,
    isLoading,
    error,
    refetch: loadAgencyData
  };
};
