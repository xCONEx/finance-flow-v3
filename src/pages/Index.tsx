
import React, { useState } from 'react';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import Dashboard from '../components/Dashboard';
import PricingCalculator from '../components/PricingCalculator';
import EntregaFlowKanban from '../components/EntregaFlowKanban';
import CompanyDashboard from '../components/CompanyDashboard';
import AdminPanel from '../components/AdminPanel';
import Settings from '../components/Settings';
import MonthlyCosts from '../components/MonthlyCosts';
import WorkItems from '../components/WorkItems';
import WorkRoutine from '../components/WorkRoutine';
import UserProfile from '../components/UserProfile';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, agencyData, userData } = useAuth();

  const isCompanyUser = user?.userType === 'company_owner' || user?.userType === 'employee' || agencyData;
  const isOwner = agencyData?.userRole === 'owner';
  const isAdmin = user?.userType === 'admin' || agencyData?.userRole === 'admin';
  const hasEnterprisePlan = userData?.subscription === 'enterprise' || agencyData?.plan === 'enterprise';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'calculator':
        return <PricingCalculator />;
      case 'kanban':
        return hasEnterprisePlan ? <EntregaFlowKanban /> : <Dashboard />;
      case 'costs':
        return <MonthlyCosts />;
      case 'items':
        return <WorkItems />;
      case 'routine':
        return <WorkRoutine />;
      case 'team':
        return isOwner ? <CompanyDashboard /> : <Dashboard />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <Dashboard />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <UserProfile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        showTeamOption={isOwner}
      />
      
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        showTeamOption={isOwner}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 mt-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
