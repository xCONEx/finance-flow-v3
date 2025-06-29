import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePrivacy } from '@/contexts/PrivacyContext';

const PerformanceWidget = () => {
  const { jobs, workRoutine } = useApp();
  const { formatValue } = usePrivacy();

  // Ensure jobs is always an array
  const safeJobs = jobs || [];

  // Calculate performance metrics
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

  const currentMonthJobs = safeJobs.filter(job => 
    job.eventDate && job.eventDate.startsWith(currentMonth) && job.status === 'aprovado'
  );
  const lastMonthJobs = safeJobs.filter(job => 
    job.eventDate && job.eventDate.startsWith(lastMonth) && job.status === 'aprovado'
  );

  const currentMonthRevenue = currentMonthJobs.reduce((sum, job) => sum + (job.valueWithDiscount || 0), 0);
  const lastMonthRevenue = lastMonthJobs.reduce((sum, job) => sum + (job.valueWithDiscount || 0), 0);

  const revenueGrowth = lastMonthRevenue > 0 
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0;

  const avgJobValue = currentMonthJobs.length > 0 
    ? currentMonthRevenue / currentMonthJobs.length 
    : 0;

  const monthlyGoal = (workRoutine?.valuePerHour || 0) * (workRoutine?.dailyHours || 8) * (workRoutine?.monthlyDays || 22);
  const goalProgress = monthlyGoal > 0 ? (currentMonthRevenue / monthlyGoal) * 100 : 0;

  const metrics = [
    {
      label: 'Receita Mensal',
      value: formatValue(currentMonthRevenue),
      change: revenueGrowth,
      icon: revenueGrowth >= 0 ? TrendingUp : TrendingDown,
      color: revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Jobs Concluídos',
      value: currentMonthJobs.length.toString(),
      change: lastMonthJobs.length > 0 
        ? ((currentMonthJobs.length - lastMonthJobs.length) / lastMonthJobs.length) * 100 
        : 0,
      icon: currentMonthJobs.length >= lastMonthJobs.length ? TrendingUp : TrendingDown,
      color: currentMonthJobs.length >= lastMonthJobs.length ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Ticket Médio',
      value: formatValue(avgJobValue),
      change: 0,
      icon: Target,
      color: 'text-blue-600'
    },
    {
      label: 'Meta Mensal',
      value: `${Math.round(goalProgress)}%`,
      change: goalProgress - 100,
      icon: Calendar,
      color: goalProgress >= 100 ? 'text-green-600' : 'text-orange-600'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                  {metric.change !== 0 && (
                    <span className={`text-xs ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {metric.label}
                </p>
                <p className={`text-lg font-bold ${metric.color}`}>
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceWidget;
