
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Dashboard from '../components/Dashboard';
import PricingCalculator from '../components/PricingCalculator';
import ImprovedKanban from '../components/ImprovedKanban';
import CompanyDashboard from '../components/CompanyDashboard';
import AdminPanel from '../components/AdminPanel';
import Settings from '../components/Settings';
import MonthlyCosts from '../components/MonthlyCosts';
import WorkItems from '../components/WorkItems';
import WorkRoutine from '../components/WorkRoutine';
import UserProfile from '../components/UserProfile';
import SubscriptionPlans from '../components/SubscriptionPlans';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();

  const isCompanyUser = user?.userType === 'company_owner' || user?.userType === 'employee';
  const isAdmin = user?.userType === 'admin';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'calculator':
        return <PricingCalculator />;
      case 'kanban':
        return isCompanyUser ? <ImprovedKanban /> : <Dashboard />;
      case 'costs':
        return <MonthlyCosts />;
      case 'items':
        return <WorkItems />;
      case 'routine':
        return <WorkRoutine />;
      case 'team':
        return isCompanyUser ? <CompanyDashboard /> : <Dashboard />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <Dashboard />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <UserProfile />;
      case 'subscription':
        return <SubscriptionPlans />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
