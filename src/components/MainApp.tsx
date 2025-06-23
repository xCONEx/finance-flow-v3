
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import Dashboard from './Dashboard';
import PricingCalculator from './PricingCalculator';
import EntregaFlowKanban from './EntregaFlowKanban';
import Settings from './Settings';
import ManagementSection from './ManagementSection';
import FinancialManagement from './financial/FinancialManagement';
import ClientsManagement from './clients/ClientsManagement';
import Navigation from './Navigation';
import { AnimatedSidebar } from './AnimatedSidebar';
import { Toaster } from './ui/toaster';
import { useTheme } from '../contexts/ThemeContext';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { profile } = useSupabaseAuth();

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
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
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

      {/* Navegação mobile (mantém a original) */}
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        showTeamOption={profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual'}
      />
      
      <Toaster />
    </div>
  );
};

export default MainApp;
