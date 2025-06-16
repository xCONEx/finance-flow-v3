
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Crown } from 'lucide-react';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';

interface UsageLimitWarningProps {
  type: 'jobs' | 'projects';
  className?: string;
}

export const UsageLimitWarning: React.FC<UsageLimitWarningProps> = ({
  type,
  className = '',
}) => {
  const { 
    limits, 
    currentUsage, 
    getRemainingJobs, 
    getRemainingProjects,
    getUsagePercentage,
    isFreePlan 
  } = useSubscriptionPermissions();

  const isJobsLimit = type === 'jobs';
  const currentCount = isJobsLimit ? currentUsage.jobsCount : currentUsage.projectsCount;
  const maxCount = isJobsLimit ? limits.maxJobs : limits.maxProjects;
  const remaining = isJobsLimit ? getRemainingJobs() : getRemainingProjects();
  const usagePercentage = getUsagePercentage(currentCount, maxCount);

  // Não mostrar aviso se é ilimitado
  if (maxCount === -1) return null;

  // Mostrar aviso quando estiver próximo do limite (80%+) ou no limite
  const shouldShowWarning = usagePercentage >= 80;
  const isAtLimit = remaining === 0;

  if (!shouldShowWarning) return null;

  return (
    <Alert className={`${className} ${isAtLimit ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <AlertTriangle className={`h-4 w-4 ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`} />
      <AlertTitle className={isAtLimit ? 'text-red-800' : 'text-yellow-800'}>
        {isAtLimit ? 'Limite Atingido!' : 'Próximo do Limite'}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div>
          <p className={`text-sm ${isAtLimit ? 'text-red-700' : 'text-yellow-700'}`}>
            Você {isAtLimit ? 'atingiu' : 'está próximo d'} o limite de{' '}
            {isJobsLimit ? 'jobs aprovados' : 'projetos'} do seu plano.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {currentCount} de {maxCount} {isJobsLimit ? 'jobs' : 'projetos'} utilizados
          </p>
        </div>
        
        <Progress value={usagePercentage} className="w-full" />
        
        {isFreePlan && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
              onClick={() => {
                window.location.hash = '#/subscription';
              }}
            >
              <Crown className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
            <p className="text-xs text-gray-600 self-center">
              Plano Básico: {isJobsLimit ? 'Jobs ilimitados' : 'Projetos ilimitados'} por R$ 29/mês
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default UsageLimitWarning;
