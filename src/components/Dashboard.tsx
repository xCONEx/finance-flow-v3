
import React from 'react';
import { DollarSign, TrendingUp, Briefcase, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const metrics = [
    {
      title: "Receita Total",
      value: "R$ 12.450",
      change: "+12%",
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Jobs Aprovados",
      value: "8",
      change: "+3",
      icon: Briefcase,
      color: "text-blue-500"
    },
    {
      title: "Margem de Lucro",
      value: "65%",
      change: "+5%",
      icon: TrendingUp,
      color: "text-purple-500"
    },
    {
      title: "Colaboradores",
      value: "4",
      change: "+1",
      icon: Users,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {metric.change} em relação ao mês anterior
              </p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${
              metric.color.includes('green') ? 'from-green-400 to-green-600' :
              metric.color.includes('blue') ? 'from-blue-400 to-blue-600' :
              metric.color.includes('purple') ? 'from-purple-400 to-purple-600' :
              'from-orange-400 to-orange-600'
            }`} />
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: "Job Aprovado", description: "Vídeo institucional - Empresa XYZ", value: "+R$ 3.500", time: "2h atrás" },
              { type: "Equipe Adicionada", description: "Novo cinegrafista cadastrado", value: "", time: "5h atrás" },
              { type: "Orçamento Criado", description: "Casamento - Cliente ABC", value: "R$ 2.800", time: "1 dia atrás" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{activity.type}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
                {activity.value && (
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{activity.value}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
