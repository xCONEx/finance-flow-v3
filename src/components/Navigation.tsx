
import React from 'react';
import { 
  Home, 
  Calculator, 
  Video,
  DollarSign, 
  Package, 
  Calendar,
  CreditCard,
  UserCheck,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showTeamOption?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, showTeamOption }) => {
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
    { id: 'management', label: 'Gerenciamento', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation - fixo no bottom */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
        <div className="flex items-center justify-around py-3">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center ${
                activeTab === item.id
                  ? 'text-blue-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;
