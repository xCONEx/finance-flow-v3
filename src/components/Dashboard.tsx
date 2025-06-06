
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Calculator, TrendingUp, Users, CheckCircle, Clock, Plus, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { formatCurrency } from '../utils/formatters';
import CostDistributionChart from './CostDistributionChart';
import RecentJobs from './RecentJobs';
import TaskList from './TaskList';
import AddTaskModal from './AddTaskModal';

const Dashboard = () => {
  const { jobs, monthlyCosts, workItems, workRoutine, tasks, addMonthlyCost } = useAppContext();
  const { currentTheme } = useTheme();
  const { valuesHidden, toggleValuesVisibility, formatValue } = usePrivacy();
  const [showTaskModal, setShowTaskModal] = useState(false);

  const approvedJobs = jobs.filter(job => job.status === 'aprovado');
  const totalJobs = approvedJobs.length;
  const totalJobsValue = approvedJobs.reduce((sum, job) => {
    const jobValue = job.valueWithDiscount || job.serviceValue || 0;
    return sum + jobValue;
  }, 0);
  
  const totalMonthlyCosts = monthlyCosts.reduce((sum, cost) => sum + cost.value, 0);
  const totalEquipmentValue = workItems.reduce((sum, item) => sum + item.value, 0);
  const hourlyRate = workRoutine?.valuePerHour || 0;

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  const metrics = [
    {
      title: 'Custos Mensais',
      value: formatValue(totalMonthlyCosts),
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Valor Equipamentos',
      value: formatValue(totalEquipmentValue),
      icon: Calculator,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Valor Hora',
      value: formatValue(hourlyRate),
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Total de Jobs',
      value: totalJobs.toString(),
      subtitle: formatValue(totalJobsValue),
      icon: TrendingUp,
      color: `text-${currentTheme.accent}`,
      bgColor: `${currentTheme.secondary}`
    }
  ];

  const handleQuickAddCost = () => {
    addMonthlyCost({
      description: 'Novo Custo',
      category: 'Geral',
      value: 0,
      month: new Date().toISOString().slice(0, 7)
    });
  };

  const handleExportReport = () => {
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
    
    const exportFileDefaultName = `financeflow-report-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Visão geral do seu negócio</p>
        </div>
        
        {/* Privacy Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleValuesVisibility}
          className="flex items-center gap-2"
        >
          {valuesHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {valuesHidden ? 'Mostrar Valores' : 'Ocultar Valores'}
        </Button>
      </div>

      {/* Metrics Cards with Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
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

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cost Distribution Chart */}
        <Card className="lg:col-span-1 transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Distribuição de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <CostDistributionChart />
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimos Jobs Calculados</CardTitle>
          </CardHeader>
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
              size="sm" 
              className={`bg-gradient-to-r ${currentTheme.primary}`}
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
              onClick={() => window.location.hash = '#calculadora'}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Nova Calculadora
            </Button>
            <Button 
              variant="outline" 
              className="w-full transition-all duration-300 hover:scale-105"
              onClick={handleQuickAddCost}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Adicionar Custo
            </Button>
            <Button 
              variant="outline" 
              className="w-full transition-all duration-300 hover:scale-105"
              onClick={handleExportReport}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Exportar Relatório
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
                  <span className="font-semibold">{jobs.filter(j => j.status === 'pendente').length}</span>
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
        </Card>
      </div>

      <AddTaskModal open={showTaskModal} onOpenChange={setShowTaskModal} />
    </div>
  );
};

export default Dashboard;
