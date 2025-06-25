
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, DollarSign, FileText, Settings, BarChart3, Shield, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagementSection = () => {
  const navigate = useNavigate();

  const managementOptions = [
    {
      title: 'Gerenciamento de Empresas',
      description: 'Gerencie empresas e colaboradores',
      icon: Building,
      path: '/company-management',
      color: 'bg-blue-500',
    },
    {
      title: 'Gerenciamento de Usuários',
      description: 'Administre usuários e permissões',
      icon: Users,
      path: '/user-management',
      color: 'bg-green-500',
    },
    {
      title: 'Gestão Financeira',
      description: 'Controle receitas e despesas',
      icon: DollarSign,
      path: '/financial',
      color: 'bg-purple-500',
    },
    {
      title: 'Relatórios',
      description: 'Visualize dados e estatísticas',
      icon: BarChart3,
      path: '/reports',
      color: 'bg-orange-500',
    },
    {
      title: 'Contratos',
      description: 'Gerencie contratos e documentos',
      icon: FileText,
      path: '/contracts',
      color: 'bg-indigo-500',
    },
    {
      title: 'Configurações do Sistema',
      description: 'Configure parâmetros do sistema',
      icon: Settings,
      path: '/system-settings',
      color: 'bg-gray-500',
    },
    {
      title: 'Segurança',
      description: 'Gerencie segurança e acessos',
      icon: Shield,
      path: '/security',
      color: 'bg-red-500',
    },
    {
      title: 'Notificações',
      description: 'Configure alertas e notificações',
      icon: Bell,
      path: '/notifications',
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Gerenciamento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Acesse todas as ferramentas de administração
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {managementOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card 
              key={option.path} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(option.path)}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {option.description}
                </p>
                <Button variant="outline" className="w-full">
                  Acessar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ManagementSection;
