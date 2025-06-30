import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';
import { useUsageTracking } from '@/hooks/useUsageTracking';

export const UsageStatus = () => {
  const { limits, currentUsage, getRemainingJobs, getRemainingProjects, getUsagePercentage } = useSubscriptionPermissions();
  const { fetchCurrentUsage } = useUsageTracking();

  const jobsPercentage = getUsagePercentage(currentUsage.jobsCount, limits.maxJobs);
  const projectsPercentage = getUsagePercentage(currentUsage.projectsCount, limits.maxProjects);

  const getPlanColor = () => {
    if (limits.maxJobs === -1) return 'text-green-600';
    if (jobsPercentage >= 90) return 'text-red-600';
    if (jobsPercentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status do Uso</span>
          <Badge 
            variant={limits.maxJobs === -1 ? "default" : "secondary"}
            className={getPlanColor()}
          >
            {limits.maxJobs === -1 ? 'Ilimitado' : `${currentUsage.jobsCount}/${limits.maxJobs}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Jobs */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Jobs criados este mês</span>
            <span className="font-medium">
              {currentUsage.jobsCount}
              {limits.maxJobs !== -1 && ` / ${limits.maxJobs}`}
            </span>
          </div>
          {limits.maxJobs !== -1 && (
            <>
              <Progress 
                value={jobsPercentage} 
                className="h-2"
                style={{
                  '--progress-background': getProgressColor(jobsPercentage)
                } as React.CSSProperties}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {getRemainingJobs() === -1 ? 'Ilimitado' : `${getRemainingJobs()} restantes`}
                </span>
                <span>{Math.round(jobsPercentage)}% usado</span>
              </div>
            </>
          )}
        </div>

        {/* Projects */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Projetos criados este mês</span>
            <span className="font-medium">
              {currentUsage.projectsCount}
              {limits.maxProjects !== -1 && ` / ${limits.maxProjects}`}
            </span>
          </div>
          {limits.maxProjects !== -1 && (
            <>
              <Progress 
                value={projectsPercentage} 
                className="h-2"
                style={{
                  '--progress-background': getProgressColor(projectsPercentage)
                } as React.CSSProperties}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {getRemainingProjects() === -1 ? 'Ilimitado' : `${getRemainingProjects()} restantes`}
                </span>
                <span>{Math.round(projectsPercentage)}% usado</span>
              </div>
            </>
          )}
        </div>

        {/* Reset Info */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Os contadores são resetados automaticamente no início de cada mês.</p>
          <button 
            onClick={fetchCurrentUsage}
            className="text-blue-600 hover:text-blue-700 underline mt-1"
          >
            Atualizar contadores
          </button>
        </div>
      </CardContent>
    </Card>
  );
}; 