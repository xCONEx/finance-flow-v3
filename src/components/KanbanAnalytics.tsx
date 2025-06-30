import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { KanbanProject } from '@/services/supabaseKanbanService';

interface KanbanAnalyticsProps {
  projects: KanbanProject[];
  isAgencyMode: boolean;
  isOwner: boolean;
}

const KanbanAnalytics: React.FC<KanbanAnalyticsProps> = ({
  projects,
  isAgencyMode,
  isOwner
}) => {
  // Cálculos dos dados
  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Projetos por status
    const statusData = [
      { name: 'Filmado', value: projects.filter(p => p.status === 'filmado').length, color: '#3B82F6' },
      { name: 'Em Edição', value: projects.filter(p => p.status === 'edicao').length, color: '#F59E0B' },
      { name: 'Revisão', value: projects.filter(p => p.status === 'revisao').length, color: '#EAB308' },
      { name: 'Entregue', value: projects.filter(p => p.status === 'entregue').length, color: '#10B981' }
    ];

    // Projetos por prioridade
    const priorityData = [
      { name: 'Alta', value: projects.filter(p => p.priority === 'alta').length, color: '#EF4444' },
      { name: 'Média', value: projects.filter(p => p.priority === 'media').length, color: '#F59E0B' },
      { name: 'Baixa', value: projects.filter(p => p.priority === 'baixa').length, color: '#10B981' }
    ];

    // Projetos entregues por mês (últimos 6 meses)
    const monthlyDeliveries = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      const deliveredCount = projects.filter(p => {
        if (p.status !== 'entregue') return false;
        const projectDate = new Date(p.updatedAt);
        return projectDate.getMonth() === date.getMonth() && 
               projectDate.getFullYear() === date.getFullYear();
      }).length;
      
      monthlyDeliveries.push({ month: monthName, entregas: deliveredCount });
    }

    // Projetos atrasados
    const overdueProjects = projects.filter(p => {
      if (!p.dueDate || p.status === 'entregue') return false;
      return new Date(p.dueDate) < now;
    });

    // Projetos com prazo próximo (2 dias)
    const urgentProjects = projects.filter(p => {
      if (!p.dueDate || p.status === 'entregue') return false;
      const deadline = new Date(p.dueDate);
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 2 && diffDays >= 0;
    });

    // Projetos por responsável (se for agência)
    const responsibleData = isAgencyMode ? 
      projects.reduce((acc, project) => {
        project.responsaveis?.forEach(responsibleId => {
          acc[responsibleId] = (acc[responsibleId] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>) : {};

    return {
      statusData,
      priorityData,
      monthlyDeliveries,
      overdueProjects,
      urgentProjects,
      responsibleData,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status !== 'entregue').length,
      completedProjects: projects.filter(p => p.status === 'entregue').length
    };
  }, [projects, isAgencyMode]);

  // Cores para gráficos
  const COLORS = ['#3B82F6', '#F59E0B', '#EAB308', '#10B981', '#EF4444', '#8B5CF6'];

  if (!isAgencyMode || !isOwner) {
    // Gráficos básicos para modo individual ou não-owner
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.activeProjects}</p>
                <p className="text-sm text-gray-600">Projetos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.completedProjects}</p>
                <p className="text-sm text-gray-600">Entregas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.urgentProjects.length}</p>
                <p className="text-sm text-gray-600">Prazos Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.overdueProjects.length}</p>
                <p className="text-sm text-gray-600">Atrasados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gráficos completos para owner da agência
  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.activeProjects}</p>
                <p className="text-sm text-gray-600">Projetos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.completedProjects}</p>
                <p className="text-sm text-gray-600">Entregas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.urgentProjects.length}</p>
                <p className="text-sm text-gray-600">Prazos Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.overdueProjects.length}</p>
                <p className="text-sm text-gray-600">Atrasados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Projetos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Status dos Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Entregas por Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Entregas por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.monthlyDeliveries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="entregas" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Prioridades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Projetos por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Projetos Atrasados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Projetos Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.overdueProjects.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum projeto atrasado! 🎉</p>
              ) : (
                analytics.overdueProjects.slice(0, 5).map(project => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{project.title}</p>
                      <p className="text-xs text-gray-600">{project.client}</p>
                    </div>
                    <Badge className="bg-red-500 text-white">
                      {Math.ceil((new Date().getTime() - new Date(project.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KanbanAnalytics; 