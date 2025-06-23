
import React from 'react';
import { 
  Home, 
  Calculator, 
  Video,
  DollarSign, 
  Package, 
  Calendar,
  CreditCard,
  UserCheck
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
    { id: 'costs', label: 'Custos', icon: DollarSign },
    { id: 'items', label: 'Itens', icon: Package },
    { id: 'routine', label: 'Rotina', icon: Calendar },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-around p-2 overflow-x-auto">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center h-16 min-w-[70px] p-2 transition-colors ${
                activeTab === item.id 
                  ? `bg-gradient-to-r ${currentTheme.primary} text-white` 
                  : `hover:bg-gradient-to-r hover:${currentTheme.secondary} hover:text-${currentTheme.accent}`
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <item.icon className="h-4 w-4 mb-1" />
              <span className="text-xs leading-tight text-center">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;
