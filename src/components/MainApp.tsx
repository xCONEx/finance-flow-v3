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
import EntregaFlowKanban from './EntregaFlowKanban';
import SubscriptionPlans from './SubscriptionPlans';
import FinancialManagement from './financial/FinancialManagement';
import ClientsManagement from './clients/ClientsManagement';
import { AgencyProvider } from '@/contexts/AgencyContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import MobileNavigation from './MobileNavigation';
import { useMobile } from '@/hooks/use-mobile';
import OnboardingModal from './OnboardingModal';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, profile, agency } = useSupabaseAuth();
  const isMobile = useMobile();
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Verificar se deve exibir o onboarding
  const shouldShowOnboarding = user && profile && !profile.onboarding_completed && showOnboarding;

  // Verificar se é admin ou tem acesso ao team
  const isAdmin = profile?.user_type === 'admin';
  const isCompanyUser = (profile?.user_type === 'company_owner' || profile?.user_type === 'employee') && !!agency;
  const showTeamOption = isCompanyUser;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onUpgradeClick={() => setActiveTab('subscription')} />;
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
    <AgencyProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-[#111]">
        {shouldShowOnboarding && (
          <OnboardingModal
            open={shouldShowOnboarding}
            onOpenChange={(open) => setShowOnboarding(open)}
            initialStep={profile?.onboarding_step || 1}
            onNavigateTab={setActiveTab}
          />
        )}
        {isMobile ? (
          <>
            <MobileNavigation 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
              showTeamOption={showTeamOption}
            />
            <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
              {renderContent()}
            </main>
          </>
        ) : (
          <>
            <Header 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              showTeamOption={showTeamOption}
            />
            
            <main className="max-w-7xl mx-auto px-4 py-6">
              {renderContent()}
            </main>

            <Navigation 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              showTeamOption={showTeamOption}
            />
          </>
        )}
      </div>
    </AgencyProvider>
  );
};

export default MainApp;
