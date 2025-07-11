import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home,
  Calculator,
  Video,
  CreditCard,
  UserCheck,
  Building,
  Settings,
  User,
  Menu,
  X,
  Bell,
  Eye,
  EyeOff,
  ChevronsRight
} from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import NotificationBell from './NotificationBell';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showTeamOption?: boolean;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  showTeamOption
}) => {
  const { user, profile, signOut } = useSupabaseAuth();
  const { currentTheme } = useTheme();
  const { valuesHidden, toggleValuesVisibility } = usePrivacy();
  const { isAdmin, isSuperAdmin, loading: loadingRoles } = useAdminRoles();
  const [isOpen, setIsOpen] = useState(false);

  const hasEnterprisePlan = profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual';
  const hasPremiumPlan = ['premium', 'enterprise', 'enterprise-annual'].includes(profile?.subscription);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    ...(hasEnterprisePlan ? [{ id: 'kanban', label: 'Projetos', icon: Video }] : []),
    ...(hasPremiumPlan ? [{ id: 'financial', label: 'Financeiro', icon: CreditCard }] : []),
    ...(hasPremiumPlan ? [{ id: 'clients', label: 'Clientes', icon: UserCheck }] : []),
    { id: 'management', label: 'Gerenciamento', icon: Building },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-[#262626] sticky top-0 z-40 md:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 bg-gradient-to-r ${currentTheme.primary} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-xl">FF</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                FinanceFlow
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleValuesVisibility}
                variant="ghost"
                size="sm"
                className="p-2"
                title={valuesHidden ? 'Mostrar valores' : 'Ocultar valores'}
              >
                {valuesHidden ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              
              <NotificationBell />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2"
              >
                {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#141414] rounded-t-2xl shadow-2xl">
            <div className="p-6 space-y-6">
              {/* Conta Atual como botão compacto */}
              <div className="flex flex-col items-center pb-2">
                <div className="w-full flex items-center bg-muted/60 dark:bg-muted/30 rounded-xl py-3 px-3 mb-2 shadow-sm border border-gray-100 dark:border-gray-800">
                  <Avatar className="h-11 w-11 mr-3">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 items-start min-w-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</span>
                  </div>
                </div>
                <div className="w-full border-b border-gray-200 dark:border-gray-700 mt-1" />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <h3 className="text-lg font-semibold mb-2">Navegação</h3>
                
                {/* Navigation Items */}
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? 'default' : 'ghost'}
                        className={`w-full justify-start h-11 px-3 ${
                          isActive 
                            ? `bg-gradient-to-r ${currentTheme.primary} text-white` 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => handleTabChange(item.id)}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>

                {/* Additional Options */}
                <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3"
                    onClick={() => handleTabChange('profile')}
                  >
                    <User className="w-5 h-5 mr-3" />
                    Meu Perfil
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3"
                    onClick={() => handleTabChange('settings')}
                  >
                    <Settings className="w-5 h-5 mr-3" />
                    Configurações
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3"
                    onClick={() => handleTabChange('subscription')}
                  >
                    <CreditCard className="w-5 h-5 mr-3" />
                    Planos
                  </Button>
                  
                  {!loadingRoles && isAdmin && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-11 px-3"
                      onClick={() => handleTabChange('admin')}
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      Admin Panel
                    </Button>
                  )}
                </div>

                {/* Sign Out */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 text-red-600 hover:text-red-700"
                    onClick={handleSignOut}
                  >
                    <X className="w-5 h-5 mr-3" />
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation; 
