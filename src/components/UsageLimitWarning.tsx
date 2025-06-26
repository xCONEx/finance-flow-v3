
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';
import { useUsageTracking } from '@/hooks/useUsageTracking';

interface UsageLimitWarningProps {
  type: 'jobs' | 'projects';
}

export const UsageLimitWarning: React.FC<UsageLimitWarningProps> = ({ type }) => {
  const { limits, subscription } = useSubscriptionPermissions();
  const { getCurrentUsage } = useUsageTracking();
  const [currentUsage, setCurrentUsage] = useState({ jobs: 0, projects: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const usage = await getCurrentUsage();
        setCurrentUsage(usage);
      } catch (error) {
        console.error('Erro ao carregar uso:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [getCurrentUsage]);

  if (loading) return null;

  const isJobType = type === 'jobs';
  const maxLimit = isJobType ? limits.maxJobs : limits.maxProjects;
  const currentCount = isJobType ? currentUsage.jobs : currentUsage.projects;
  const typeName = isJobType ? 'jobs' : 'projetos';

  // Não mostrar aviso para planos ilimitados
  if (maxLimit === -1) return null;

  const usagePercentage = (currentCount / maxLimit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = currentCount >= maxLimit;

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-4">
      {isAtLimit ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      <AlertTitle>
        {isAtLimit ? `Limite de ${typeName} atingido` : `Próximo ao limite de ${typeName}`}
      </AlertTitle>
      <AlertDescription>
        {isAtLimit ? (
          <>
            Você atingiu o limite de {maxLimit} {typeName} do plano {subscription}. 
            Faça upgrade para continuar criando novos {typeName}.
          </>
        ) : (
          <>
            Você está usando {currentCount} de {maxLimit} {typeName} disponíveis no plano {subscription} 
            ({Math.round(usagePercentage)}%). Considere fazer upgrade antes de atingir o limite.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};
