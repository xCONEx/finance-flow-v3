
import React from 'react';
import { 
  Home, 
  Calculator, 
  Video,
  DollarSign, 
  Package, 
  Calendar,
  CreditCard,
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
    { id: 'costs', label: 'Custos', icon: DollarSign },
    ...(hasPremiumPlan ? [{ id: 'financial', label: 'Financeiro', icon: CreditCard }] : []),
    { id: 'items', label: 'Itens', icon: Package },
    { id: 'routine', label: 'Rotina', icon: Calendar },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation - fixo no bottom */}
<div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-md">
  <div className="flex items-center justify-between">
    {navigationItems.map((item) => (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
          activeTab === item.id
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
        }`}
      >
        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : ''}`} />
        <span className="text-[10px] font-medium mt-1">
          {item.label.length > 8 ? item.label.slice(0, 8) + '…' : item.label}
        </span>
      </button>
    ))}
  </div>
</div>


    </>
  );
};

export default Navigation;
