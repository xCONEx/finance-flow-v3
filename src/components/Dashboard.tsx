import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Calculator, TrendingUp, Users, CheckCircle, Clock, Plus, Building2, Target, Zap } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useApp } from '../contexts/AppContext';
import { useSubscriptionPermissions } from '../hooks/useSubscriptionPermissions';
import CostDistributionChart from './CostDistributionChart';
import RecentJobs from './RecentJobs';
import TaskList from './TaskList';
import AddTaskModal from './AddTaskModal';
import ManualValueModal from '@/components/ManualValueModal';
import ExpenseModal from '@/components/ExpenseModal';
import { UsageLimitWarning } from './UsageLimitWarning';
import { SubscriptionStatus } from './SubscriptionStatus';
import PremiumFeatureBlock from './PremiumFeatureBlock';
import MetricCard from './dashboard/MetricCard';
import PerformanceWidget from './dashboard/PerformanceWidget';
import ActivityTimeline from './dashboard/ActivityTimeline';
import WeeklyOverview from './dashboard/WeeklyOverview';

const Dashboard = () => {
  const { user, profile, agency } = useSupabaseAuth();
  const { currentTheme } = useTheme();
  const { formatValue } = usePrivacy();
  const { jobs, monthlyCosts, workItems, workRoutine, tasks, addMonthlyCost } = useApp();
  const { limits, canCreateJob, isFreePlan } = useSubscriptionPermissions();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // ULTRA-CRITICAL: Ensure all arrays are safe before any operations
  const safeJobs = React.useMemo(() => {
    console.log('🔥 Dashboard - jobs safety check:', { 
      jobs: jobs ? 'defined' : 'undefined',
      isArray: Array.isArray(jobs),
      length: Array.isArray(jobs) ? jobs.length : 'NOT_ARRAY'
    });
    return Array.isArray(jobs) ? jobs : [];
  }, [jobs]);

  const safeMonthlyCosts = React.useMemo(() => {
    console.log('🔥 Dashboard - monthlyCosts safety check:', { 
      monthlyCosts: monthlyCosts ? 'defined' : 'undefined',
      isArray: Array.isArray(monthlyCosts),
      length: Array.isArray(monthlyCosts) ? monthlyCosts.length : 'NOT_ARRAY'
    });
    return Array.isArray(monthlyCosts) ? monthlyCosts : [];
  }, [monthlyCosts]);

  const safeWorkItems = React.useMemo(() => {
    console.log('🔥 Dashboard - workItems safety check:', { 
      workItems: workItems ? 'defined' : 'undefined',
      isArray: Array.isArray(workItems),
      length: Array.isArray(workItems) ? workItems.length : 'NOT_ARRAY'
    });
    return Array.isArray(workItems) ? workItems : [];
  }, [workItems]);

  const safeTasks = React.useMemo(() => {
    console.log('🔥 Dashboard - tasks safety check:', { 
      tasks: tasks ? 'defined' : 'undefined',
      isArray: Array.isArray(tasks),
      length: Array.isArray(tasks) ? tasks.length : 'NOT_ARRAY'
    });
    return Array.isArray(tasks) ? tasks : [];
  }, [tasks]);

  // Dashboard sempre usa dados pessoais do usuário
  const isCompanyUser = (user && (profile?.user_type === 'company_owner' || profile?.user_type === 'employee')) && !!agency;

  // Filtrar apenas jobs pessoais (sem companyId) - ULTRA-SAFE
  const filteredJobs = React.useMemo(() => {
    try {
      console.log('🔥 Dashboard - filtering jobs:', { safeJobsLength: safeJobs.length });
      return safeJobs.filter(job => {
        if (!job || typeof job !== 'object') {
          console.log('🔥 Dashboard - Invalid job object:', job);
          return false;
        }
        return !job.companyId;
      });
    } catch (error) {
      console.error('🔥 Dashboard - Error filtering jobs:', error);
      return [];
    }
  }, [safeJobs]);
  
  // Filter only regular monthly costs (exclude financial transactions and reserves) - ULTRA-SAFE
  const regularMonthlyCosts = React.useMemo(() => {
    try {
      console.log('🔥 Dashboard - filtering monthlyCosts:', { safeMonthlyCostsLength: safeMonthlyCosts.length });
      return safeMonthlyCosts.filter(cost => {
        if (!cost || typeof cost !== 'object') {
          console.log('🔥 Dashboard - Invalid cost object:', cost);
          return false;
        }
        
        const description = cost.description || '';
        const category = cost.category || '';
        
        return !description.includes('FINANCIAL_INCOME:') && 
          !description.includes('FINANCIAL_EXPENSE:') &&
          !description.includes('RESERVE_') &&
          !description.includes('Reserva:') &&
          !description.includes('SMART_RESERVE') &&
          category !== 'Reserva' &&
          category !== 'Smart Reserve' &&
          category !== 'Reserve' &&
          !cost.companyId; // Only personal costs
      });
    } catch (error) {
      console.error('🔥 Dashboard - Error filtering monthlyCosts:', error);
      return [];
    }
  }, [safeMonthlyCosts]);

  const filteredWorkItems = React.useMemo(() => {
    try {
      console.log('🔥 Dashboard - filtering workItems:', { safeWorkItemsLength: safeWorkItems.length });
      return safeWorkItems.filter(item => {
        if (!item || typeof item !== 'object') {
          console.log('🔥 Dashboard - Invalid workItem object:', item);
          return false;
        }
        return !item.companyId;
      });
    } catch (error) {
      console.error('🔥 Dashboard - Error filtering workItems:', error);
      return [];
    }
  }, [safeWorkItems]);

  // Calcular apenas jobs concluídos pessoais - ULTRA-SAFE
  const completedJobs = React.useMemo(() => {
    try {
      console.log('🔥 Dashboard - filtering completed jobs:', { filteredJobsLength: filteredJobs.length });
      return filteredJobs.filter(job => {
        if (!job || typeof job !== 'object') {
          console.log('🔥 Dashboard - Invalid job in completed filter:', job);
          return false;
        }
        return job.status === 'concluído';
      });
    } catch (error) {
      console.error('🔥 Dashboard - Error filtering completed jobs:', error);
      return [];
    }
  }, [filteredJobs]);

  const completedTasksFiltered = React.useMemo(() => {
    try {
      console.log('🔥 Dashboard - filtering completed tasks:', { safeTasksLength: safeTasks.length });
      return safeTasks.filter(task => {
        if (!task || typeof task !== 'object') {
          console.log('🔥 Dashboard - Invalid task object:', task);
          return false;
        }
        return task.completed === true;
      });
    } catch (error) {
      console.error('🔥 Dashboard - Error filtering completed tasks:', error);
      return [];
    }
  }, [safeTasks]);

  // Calculate metrics safely
  const totalJobs = completedJobs.length;
  const totalJobsValue = completedJobs.reduce((sum, job) => {
    const jobValue = job.valueWithDiscount || job.serviceValue || 0;
    return sum + (typeof jobValue === 'number' ? jobValue : 0);
  }, 0);
  
  // Use only regular monthly costs for the total
  const totalMonthlyCosts = regularMonthlyCosts.reduce((sum, cost) => {
    const costValue = cost.value || 0;
    return sum + (typeof costValue === 'number' ? costValue : 0);
  }, 0);
  
  const totalEquipmentValue = filteredWorkItems.reduce((sum, item) => {
    const itemValue = item.value || 0;
    return sum + (typeof itemValue === 'number' ? itemValue : 0);
  }, 0);
  
  const hourlyRate = workRoutine?.valuePerHour || 0;

  const completedTasks = completedTasksFiltered.length;
  const totalTasks = safeTasks.length;

  // Calculate additional metrics safely
  const pendingJobs = React.useMemo(() => {
    try {
      return filteredJobs.filter(job => {
        if (!job || typeof job !== 'object') return false;
        return job.status === 'pendente';
      }).length;
    } catch (error) {
      console.error('🔥 Dashboard - Error calculating pending jobs:', error);
      return 0;
    }
  }, [filteredJobs]);

  const inProgressJobs = React.useMemo(() => {
    try {
      return filteredJobs.filter(job => {
        if (!job || typeof job !== 'object') return false;
        return job.status === 'em_andamento';
      }).length;
    } catch (error) {
      console.error('🔥 Dashboard - Error calculating in progress jobs:', error);
      return 0;
    }
  }, [filteredJobs]);

  const avgJobValue = totalJobs > 0 ? totalJobsValue / totalJobs : 0;
  const monthlyGoal = hourlyRate * (workRoutine?.dailyHours || 8) * (workRoutine?.monthlyDays || 22);
  const goalProgress = monthlyGoal > 0 ? (totalJobsValue / monthlyGoal) * 100 : 0;

  const metrics = [
    {
      title: 'Receita Total',
      value: formatValue(totalJobsValue),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      trend: { value: 12.5, isPositive: true }
    },
    {
      title: 'Jobs Concluídos',
      value: totalJobs.toString(),
      subtitle: `${pendingJobs} pendentes`,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      trend: { value: 8.3, isPositive: true }
    },
    {
      title: 'Custos Mensais',
      value: formatValue(totalMonthlyCosts),
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      trend: { value: 3.2, isPositive: false }
    },
    {
      title: 'Ticket Médio',
      value: formatValue(avgJobValue),
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      trend: { value: 5.7, isPositive: true }
    },
    {
      title: 'Valor Hora',
      value: formatValue(hourlyRate),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
    },
    {
      title: 'Meta Mensal',
      value: `${Math.round(goalProgress)}%`,
      subtitle: formatValue(monthlyGoal),
      icon: Zap,
      color: goalProgress >= 100 ? 'text-green-600' : 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20'
    }
  ];

  return (
    <div className="space-y-8 pb-20 md:pb-6">
      {/* Modern Header */}
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl rounded-full"></div>
          <h1 className="relative text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Pessoal
          </h1>
        </div>
        
        {/* Company Information */}
        {isCompanyUser && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto backdrop-blur-sm">
            <div className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Empresa: {agency?.name}</p>
                <p className="text-sm opacity-75">Este dashboard mostra seus dados pessoais.</p>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Visão completa do seu negócio pessoal
        </p>
      </div>

      {/* Usage Warnings */}
      <div className="space-y-4">
        <UsageLimitWarning type="jobs" />
        <UsageLimitWarning type="projects" />
      </div>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            color={metric.color}
            bgColor={metric.bgColor}
            trend={metric.trend}
          />
        ))}
      </div>

      {/* Subscription Status */}
      <SubscriptionStatus />

      {/* New Information Widgets */}
      <div className="grid lg:grid-cols-2 gap-6">
        <PerformanceWidget />
        <ActivityTimeline />
      </div>

      {/* Weekly Overview */}
      <WeeklyOverview />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cost Distribution Chart */}
        {limits.canUseAdvancedReports ? (
          <Card className="lg:col-span-1 transition-all duration-300 hover:shadow-lg border-0 shadow-md">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Distribuição de Custos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CostDistributionChart />
            </CardContent>
          </Card>
        ) : (
          <PremiumFeatureBlock
            feature="Gráfico de Distribuição de Custos"
            requiredPlan="basic"
            className="lg:col-span-1"
          />
        )}

        {/* Recent Jobs */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardContent>
            <RecentJobs />
          </CardContent>
        </Card>
      </div>

      {/* Tasks and Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enhanced Task List */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              Tarefas ({completedTasks}/{totalTasks})
            </CardTitle>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg"
              onClick={() => setShowTaskModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </CardHeader>
          <CardContent>
            <TaskList />
          </CardContent>
        </Card>

        {/* Enhanced Quick Actions */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg"
              onClick={() => {
                if (!canCreateJob) {
                  alert('Você atingiu o limite de jobs do seu plano!');
                  return;
                }
                setShowManualModal(true);
              }}
              disabled={!canCreateJob}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Adicionar Valor Manual
              {!canCreateJob && ' (Limite atingido)'}
            </Button>

            <Button
              variant="outline"
              className="w-full transition-all duration-300 hover:scale-105 border-2 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              onClick={() => setShowExpenseModal(true)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Adicionar Custo
            </Button>

            <Button
              variant="outline"
              className="w-full transition-all duration-300 hover:scale-105 border-2 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={() => {
                if (!limits.canUseAdvancedReports) {
                  alert('Relatórios avançados disponíveis apenas nos planos pagos!');
                  return;
                }

                // Generate enhanced report safely
                try {
                  const report = {
                    data: new Date().toISOString(),
                    summary: {
                      totalJobs,
                      totalJobsValue,
                      totalMonthlyCosts,
                      totalEquipmentValue,
                      hourlyRate,
                      avgJobValue,
                      goalProgress
                    },
                    tasks: {
                      completedTasks,
                      totalTasks,
                      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
                    },
                    jobs: {
                      pending: pendingJobs,
                      inProgress: inProgressJobs,
                      completed: totalJobs
                    }
                  };

                  const dataStr = JSON.stringify(report, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  
                  const exportFileDefaultName = `financeflow-report-pessoal-${new Date().toISOString().slice(0, 10)}.json`;
                  
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                } catch (error) {
                  console.error('🔥 Dashboard - Error exporting report:', error);
                  alert('Erro ao exportar relatório');
                }
              }}
              disabled={!limits.canUseAdvancedReports}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {limits.canUseAdvancedReports ? 'Exportar Relatório' : 'Relatório (Premium)'}
            </Button>

            {/* Enhanced Summary Stats */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Faturamento:</span>
                    <span className="font-semibold text-green-600">{formatValue(totalJobsValue)}</span>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Jobs Pendentes:</span>
                    <span className="font-semibold text-blue-600">{pendingJobs}</span>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Taxa Conclusão:</span>
                    <span className="font-semibold text-purple-600">
                      {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Meta Mensal:</span>
                    <span className={`font-semibold ${goalProgress >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                      {Math.round(goalProgress)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Modals */}
          <ManualValueModal open={showManualModal} onOpenChange={setShowManualModal} />
          <ExpenseModal open={showExpenseModal} onOpenChange={setShowExpenseModal} />
        </Card>
      </div>

      <AddTaskModal open={showTaskModal} onOpenChange={setShowTaskModal} />
    </div>
  );
};

export default Dashboard;
