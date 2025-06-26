
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Calculator, 
  Package, 
  Clock, 
  Settings,
  Crown,
  Shield
} from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useAgency } from '../contexts/AgencyContext';
import CompanyManagement from './CompanyManagement';
import CompanyDashboard from './CompanyDashboard';

const ManagementSection = () => {
  const { profile } = useSupabaseAuth();
  const { currentContext, agencies } = useAgency();
  const [activeView, setActiveView] = useState('overview');

  const isAdmin = profile?.user_type === 'admin';
  
  // Verificar se é owner da empresa atual
  const currentAgency = currentContext !== 'individual' ? currentContext : null;
  const isOwner = currentAgency && agencies.find(a => a.id === currentAgency.id)?.is_owner;

  if (activeView === 'admin') {
    return <CompanyManagement />;
  }

  if (activeView === 'company-dashboard') {
    return <CompanyDashboard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Settings className="text-white font-bold text-2xl"/>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento</h1>
          <p className="text-gray-600">Acesse ferramentas de gestão e administração</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard da Empresa - Só para owners */}
        {isOwner && currentAgency && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Building2 className="h-5 w-5" />
                Dashboard da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Gerencie sua empresa, colaboradores e acompanhe métricas importantes.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Gestão de Colaboradores</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calculator className="h-4 w-4" />
                  <span>Custos e Receitas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="h-4 w-4" />
                  <span>Itens de Trabalho</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Rotina de Trabalho</span>
                </div>
              </div>
              <Button 
                onClick={() => setActiveView('company-dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Acessar Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Administração do Sistema - Só para admins */}
        {isAdmin && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Shield className="h-5 w-5" />
                Administração do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Ferramentas administrativas para gerenciar o sistema completo.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>Gerenciar Empresas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Usuários do Sistema</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Settings className="h-4 w-4" />
                  <span>Configurações Globais</span>
                </div>
              </div>
              <Button 
                onClick={() => setActiveView('admin')}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Painel Admin
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Outras opções de gerenciamento podem ser adicionadas aqui */}
        <Card className="hover:shadow-lg transition-shadow opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <Calculator className="h-5 w-5" />
              Relatórios Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Em breve: Relatórios detalhados de receitas, despesas e lucratividade.
            </p>
            <Button disabled className="w-full">
              Em Desenvolvimento
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <Users className="h-5 w-5" />
              Gestão de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Em breve: CRM completo para gerenciar relacionamento com clientes.
            </p>
            <Button disabled className="w-full">
              Em Desenvolvimento
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Voltar para visão geral */}
      {activeView !== 'overview' && (
        <div className="flex justify-center pt-6">
          <Button 
            variant="outline" 
            onClick={() => setActiveView('overview')}
          >
            Voltar ao Gerenciamento
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManagementSection;
