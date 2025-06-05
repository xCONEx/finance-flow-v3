
import React from 'react';
import { DollarSign, TrendingUp, Briefcase, Users, Calculator, Settings, Plus, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '../contexts/AppContext';
import CostDistributionChart from './CostDistributionChart';
import RecentJobs from './RecentJobs';
import TaskList from './TaskList';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { jobs, monthlyCosts, workItems, workRoutine } = useAppContext();
  
  const approvedJobs = jobs.filter(job => job.status === 'aprovado');
  const totalRevenue = approvedJobs.reduce((sum, job) => sum + job.serviceValue, 0);
  const totalMonthlyCosts = monthlyCosts.reduce((sum, cost) => sum + cost.value, 0);
  const totalEquipmentValue = workItems
    .filter(item => item.category.toLowerCase().includes('equipamento'))
    .reduce((sum, item) => sum + item.value, 0);

  const metrics = [
    {
      title: "Receita Total",
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "+12%",
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Custos Mensais",
      value: `R$ ${totalMonthlyCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "-5%",
      icon: TrendingUp,
      color: "text-red-500"
    },
    {
      title: "Valor Equipamentos",
      value: `R$ ${totalEquipmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "+8%",
      icon: Settings,
      color: "text-blue-500"
    },
    {
      title: "Valor Hora",
      value: `R$ ${workRoutine.valuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "Atual",
      icon: Calculator,
      color: "text-purple-500"
    },
    {
      title: "Total de Jobs",
      value: approvedJobs.length.toString(),
      change: `+${jobs.filter(job => job.status === 'pendente').length} pendentes`,
      icon: Briefcase,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          FinanceFlow
        </h1>
        <p className="text-lg text-gray-600">Gestão financeira inteligente para produtores audiovisuais</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className={`text-xs ${metric.color} font-medium`}>
                {metric.change}
              </p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${
              metric.color.includes('green') ? 'from-green-400 to-green-600' :
              metric.color.includes('red') ? 'from-red-400 to-red-600' :
              metric.color.includes('blue') ? 'from-blue-400 to-blue-600' :
              metric.color.includes('purple') ? 'from-purple-400 to-purple-600' :
              'from-orange-400 to-orange-600'
            }`} />
          </Card>
        ))}
      </div>

      {/* Charts and Lists Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cost Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Distribuição de Custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CostDistributionChart />
          </CardContent>
        </Card>

        {/* Task List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Lista de Tarefas
            </CardTitle>
            <Button size="sm" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <TaskList />
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Últimos Jobs Calculados
          </CardTitle>
          <Button variant="outline" size="sm">
            Ver Histórico
          </Button>
        </CardHeader>
        <CardContent>
          <RecentJobs />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
