import React from 'react';
import { 
  Home, 
  Calculator, 
  Video,
  CreditCard, 
  UserCheck,
  Settings,
  Building
} from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showTeamOption?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  showTeamOption
}) => {
  const { profile, agency } = useSupabaseAuth();
  const { currentTheme } = useTheme();

  const hasEnterprisePlan = profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual';
  const hasPremiumPlan = ['premium', 'enterprise', 'enterprise-annual'].includes(profile?.subscription);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    ...(hasEnterprisePlan ? [{ id: 'kanban', label: 'Projetos', icon: Video }] : []),
    ...(hasPremiumPlan ? [{ id: 'financial', label: 'Financeiro', icon: CreditCard }] : []),
    ...(hasPremiumPlan ? [{ id: 'clients', label: 'Clientes', icon: UserCheck }] : []),
    { id: 'management', label: 'Gerenciamento', icon: Building },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 
        bg-white/80 dark:bg-[#141414]/80 backdrop-blur-md 
        border border-gray-200 dark:border-[#262626] 
        rounded-2xl shadow-xl px-4 py-2 flex justify-between items-center">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`p-2 rounded-full transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-label={item.label}
          >
            <Icon className="w-6 h-6" />
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;
