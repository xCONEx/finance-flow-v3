import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Calculator, TrendingUp, Users, CheckCircle, Clock, Plus, Trash2, Building2, User, Target, Briefcase } from 'lucide-react';
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

const Dashboard = () => {
  const { user, profile, agency } = useSupabaseAuth();
  const { currentTheme } = useTheme();
  const { formatValue } = usePrivacy();
  const { jobs, monthlyCosts, workItems, workRoutine, tasks, addMonthlyCost } = useApp();
  const { limits, canCreateJob, isFreePlan } = useSubscriptionPermissions();
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Dashboard sempre usa dados pessoais do usuário
  const isCompanyUser = (user && (profile?.user_type === 'company_owner' || profile?.user_type === 'employee')) && !!agency;
  
  // Dashboard sempre mostra dados pessoais
  const currentData = profile;

  const [showManualModal, setShowManualModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Filtrar apenas jobs pessoais (sem companyId)
  const filteredJobs = jobs.filter(job => !job.companyId);
  
  // Filter only regular monthly costs (exclude financial transactions and reserves)
  const regularMonthlyCosts = monthlyCosts.filter(cost => 
    !cost.description?.includes('FINANCIAL_INCOME:') && 
    !cost.description?.includes('FINANCIAL_EXPENSE:') &&
    !cost.description?.includes('RESERVE_') &&
    !cost.description?.includes('Reserva:') &&
    !cost.description?.includes('SMART_RESERVE') &&
    cost.category !== 'Reserva' &&
    cost.category !== 'Smart Reserve' &&
    cost.category !== 'Reserve' &&
    !cost.companyId // Only personal costs
  );

  const filteredWorkItems = workItems.filter(item => !item.companyId);

  // Calcular apenas jobs aprovados pessoais
  const approvedJobs = filteredJobs.filter(job => job.status === 'aprovado');
  const totalJobs = approvedJobs.length;
  const totalJobsValue = approvedJobs.reduce((sum, job) => {
    const jobValue = job.valueWithDiscount || job.serviceValue || 0;
    return sum + jobValue;
  }, 0);
  
  // Calcular ticket médio
  const averageTicket = totalJobs > 0 ? totalJobsValue / totalJobs : 0;
  
  // Calcular meta mensal (baseada no valor por hora * horas trabalhadas por mês)
  const monthlyGoal = workRoutine?.valuePerHour * (workRoutine?.workHoursPerDay || 8) * (workRoutine?.workDaysPerMonth || 22);
  
  // Use only regular monthly costs for the total
  const totalMonthlyCosts = regularMonthlyCosts.reduce((sum, cost) => sum + cost.value, 0);
  const totalEquipmentValue = filteredWorkItems.reduce((sum, item) => sum + item.value, 0);
  const hourlyRate = workRoutine?.valuePerHour || 0;

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  // Log para debug
  console.log('📊 Dashboard - Monthly Costs Only:', 'Regular costs:', regularMonthlyCosts.length, 'Total value:', totalMonthlyCosts);
  console.log('📊 Dashboard - Jobs:', {
    totalJobs: jobs.length,
    filteredJobs: filteredJobs.length,
    approvedJobs: approvedJobs.length,
    totalJobsValue,
    averageTicket,
    monthlyGoal
  });

  const metrics = [
    {
      title: 'Receita Total',
      value: formatValue(totalJobsValue),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Jobs Concluídos',
      value: totalJobs.toString(),
      subtitle: formatValue(totalJobsValue),
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Ticket Médio',
      value: formatValue(averageTicket),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Meta Mensal',
      value: formatValue(monthlyGoal),
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Custos Mensais',
      value: formatValue(totalMonthlyCosts),
      icon: Calculator,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Valor Equipamentos',
      value: formatValue(totalEquipmentValue),
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      title: 'Valor Hora',
      value: formatValue(hourlyRate),
      icon: Clock,
      color: `text-${currentTheme.accent}`,
      bgColor: `${currentTheme.secondary}`
    }
  ];

  const handleQuickAddCost = () => {
    addMonthlyCost({
      description: 'Novo Custo',
      category: 'Geral',
      value: 0,
      month: new Date().toISOString().slice(0, 7),
      isRecurring: false,
      notificationEnabled: true
    });
  };

  const handleExportReport = () => {
    if (!limits.canUseAdvancedReports) {
      alert('Relatórios avançados disponíveis apenas nos planos pagos!');
      return;
    }

    // Generate a simple report
    const report = {
      data: new Date().toISOString(),
      totalJobs,
      totalJobsValue,
      totalMonthlyCosts,
      totalEquipmentValue,
      hourlyRate,
      completedTasks,
      totalTasks
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financeflow-report-pessoal-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header simplificado */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Dashboard Pessoal</h1>
        
        {/* Informação para colaboradores */}
        {isCompanyUser && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Building2 className="h-5 w-5" />
              <p className="text-sm">
                <strong>Empresa:</strong> {agency?.name} | 
                <span className="ml-2">Este dashboard mostra seus dados pessoais.</span>
              </p>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Para projetos da empresa, acesse o Kanban na navegação.
            </p>
          </div>
        )}
        
        <p className="text-gray-600 dark:text-gray-400">
          Visão geral do seu negócio pessoal
        </p>
      </div>

      {/* Avisos de limite de uso */}
      <div className="space-y-4">
        <UsageLimitWarning type="jobs" />
        <UsageLimitWarning type="projects" />
      </div>

      {/* Metrics Cards with Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metrics.slice(0, 4).map((metric, index) => (
          <Card 
            key={index} 
            className={`${metric.bgColor} transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  {metric.subtitle && (
                    <p className={`text-sm font-medium ${metric.color} opacity-75`}>{metric.subtitle}</p>
                  )}
                </div>
                <metric.icon className={`h-8 w-8 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.slice(4).map((metric, index) => (
          <Card 
            key={index + 4} 
            className={`${metric.bgColor} transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  {metric.subtitle && (
                    <p className={`text-sm font-medium ${metric.color} opacity-75`}>{metric.subtitle}</p>
                  )}
                </div>
                <metric.icon className={`h-8 w-8 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status da Assinatura */}
      <SubscriptionStatus />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cost Distribution Chart */}
        {limits.canUseAdvancedReports ? (
          <Card className="lg:col-span-1 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Distribuição de Custos</CardTitle>
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
        <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-lg">
          <CardContent>
            <RecentJobs />
          </CardContent>
        </Card>
      </div>

      {/* Tasks and Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Task List */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tarefas ({completedTasks}/{totalTasks})
            </CardTitle>
            <Button 
              className={`bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 transition-all duration-300 hover:scale-105`}
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

        {/* Quick Actions */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className={`w-full bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 transition-all duration-300 hover:scale-105`}
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
              className="w-full transition-all duration-300 hover:scale-105"
              onClick={() => setShowExpenseModal(true)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Adicionar Custo
            </Button>

            <Button
              className="w-full transition-all duration-300 hover:scale-105"
              onClick={() => {
                if (!limits.canUseAdvancedReports) {
                  alert('Relatórios avançados disponíveis apenas nos planos pagos!');
                  return;
                }

                // Generate a simple report
                const report = {
                  data: new Date().toISOString(),
                  totalJobs,
                  totalJobsValue,
                  totalMonthlyCosts,
                  totalEquipmentValue,
                  hourlyRate,
                  completedTasks,
                  totalTasks
                };

                const dataStr = JSON.stringify(report, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = `financeflow-report-pessoal-${new Date().toISOString().slice(0, 10)}.json`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
              disabled={!limits.canUseAdvancedReports}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {limits.canUseAdvancedReports ? 'Exportar Relatório' : 'Relatório (Premium)'}
            </Button>

            {/* Summary Stats */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Faturamento Total:</span>
                  <span className="font-semibold">{formatValue(totalJobsValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Jobs Pendentes:</span>
                  <span className="font-semibold">{filteredJobs.filter(j => j.status === 'pendente').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Taxa de Conclusão:</span>
                  <span className="font-semibold">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Modais que abrem ao clicar nos botões */}
          <ManualValueModal open={showManualModal} onOpenChange={setShowManualModal} />
          <ExpenseModal open={showExpenseModal} onOpenChange={setShowExpenseModal} />
        </Card>
      </div>

      <AddTaskModal open={showTaskModal} onOpenChange={setShowTaskModal} />
    </div>
  );
};

export default Dashboard;
