
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Zap, Crown, Building, Users, HardDrive, Clock } from 'lucide-react';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';

export const SubscriptionStatus: React.FC = () => {
  const { 
    subscription,
    limits,
    currentUsage,
    getUsagePercentage,
    loading
  } = useSubscriptionPermissions();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlanName = () => {
    switch (subscription) {
      case 'basic': return 'Básico';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      case 'enterprise-annual': return 'Enterprise Anual';
      default: return 'Gratuito';
    }
  };

  const getPlanIcon = () => {
    switch (subscription) {
      case 'basic': return <Zap className="h-5 w-5" />;
      case 'premium': return <Crown className="h-5 w-5" />;
      case 'enterprise':
      case 'enterprise-annual': return <Building className="h-5 w-5" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getPlanColor = () => {
    switch (subscription) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'enterprise':
      case 'enterprise-annual': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Ilimitado';
    return value.toLocaleString();
  };

  const formatStorage = (mb: number) => {
    if (mb === -1) return 'Ilimitado';
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)}GB`;
    return `${mb}MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Status da Assinatura
          </div>
          <Badge className={getPlanColor()}>
            {getPlanIcon()}
            <span className="ml-1">{getPlanName()}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Uso atual */}
        <div className="space-y-4">
          {/* Jobs */}
          {limits.maxJobs !== -1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Jobs Aprovados</span>
                <span>{currentUsage.jobsCount} de {formatLimit(limits.maxJobs)}</span>
              </div>
              <Progress value={getUsagePercentage(currentUsage.jobsCount, limits.maxJobs)} />
            </div>
          )}
          
          {/* Projetos */}
          {limits.maxProjects !== -1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Projetos</span>
                <span>{currentUsage.projectsCount} de {formatLimit(limits.maxProjects)}</span>
              </div>
              <Progress value={getUsagePercentage(currentUsage.projectsCount, limits.maxProjects)} />
            </div>
          )}
        </div>

        {/* Recursos disponíveis */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Recursos Inclusos</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>Equipe: {formatLimit(limits.maxTeamMembers)}</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-gray-500" />
              <span>Armazenamento: {formatStorage(limits.maxStorage)}</span>
            </div>
            {limits.canUseAdvancedReports && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Relatórios Avançados</span>
              </div>
            )}
            {limits.canUseCollaboration && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Colaboração</span>
              </div>
            )}
            {limits.canUseBackup && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Backup Automático</span>
              </div>
            )}
            {limits.canUse247Support && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span>Suporte 24/7</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
