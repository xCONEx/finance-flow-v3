
import React, { useState } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import Dashboard from './Dashboard';
import PricingCalculator from './PricingCalculator';
import ManagementSection from './ManagementSection';
import Settings from './Settings';
import UserProfile from './UserProfile';
import AdminPanel from './AdminPanel';
import TeamManagement from './TeamManagement';
import EntregaFlowKanban from './EntregaFlowKanban_old';
import SubscriptionPlans from './SubscriptionPlans';
import FinancialManagement from './financial/FinancialManagement';
import ClientsManagement from './clients/ClientsManagement';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, profile, agency } = useSupabaseAuth();

  // Verificar se é admin ou tem acesso ao team
  const isAdmin = profile?.user_type === 'admin';
  const isCompanyUser = (profile?.user_type === 'company_owner' || profile?.user_type === 'employee') && !!agency;
  const showTeamOption = isCompanyUser;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'calculator':
        return <PricingCalculator />;
      case 'kanban':
        return <EntregaFlowKanban />;
      case 'financial':
        return <FinancialManagement />;
      case 'clients':
        return <ClientsManagement />;
      case 'management':
        return <ManagementSection />;
      case 'team':
        return <TeamManagement />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <UserProfile />;
      case 'subscription':
        return <SubscriptionPlans />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Sidebar animada para desktop */}
      <AnimatedSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      
      {/* Conteúdo principal */}
      <div className="flex-1 md:ml-12 transition-all duration-200">
        <div className="p-4 md:p-6">
          {renderContent()}
        </div>
      </div>

      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        showTeamOption={showTeamOption}
      />
    </div>
  );
};

export default MainApp;
