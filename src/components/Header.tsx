import React, { useState } from 'react';
import { 
  Calculator, 
  Video, 
  CreditCard, 
  UserCheck, 
  Settings, 
  User, 
  Sun, 
  Moon, 
  Building,
  ChevronDown,
  Eye,
  EyeOff,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showTeamOption?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onTabChange, 
  showTeamOption 
}) => {
  const { user, profile, signOut, agency } = useSupabaseAuth();
  const { currentTheme, toggleDarkMode, isDark } = useTheme();
  const { valuesHidden, toggleValuesVisibility } = usePrivacy();
  
  const hasEnterprisePlan = profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual';
  const hasPremiumPlan = ['premium', 'enterprise', 'enterprise-annual'].includes(profile?.subscription);
  const isAdmin = profile?.user_type === 'admin';

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
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getActiveTabTitle = () => {
    const activeItem = navigationItems.find(item => item.id === activeTab);
    return activeItem ? activeItem.label : 'Dashboard';
  };

  return (
    <header className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-[#262626] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Navegação Desktop */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 bg-gradient-to-r ${currentTheme.primary} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-xl">FF</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                FinanceFlow
              </h1>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-150
                      ${isActive
                        ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-sm`
                        : `bg-transparent text-[color:var(--primary)] dark:text-[color:var(--primary)] shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]`}
                      font-medium`}
                    style={{
                      textShadow: isActive ? 'none' : '0 1px 4px rgba(0,0,0,0.10)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>


          {/* Ações do usuário */}
          <div className="flex items-center space-x-4">
            {/* Privacy Toggle */}
            <Button
              onClick={toggleValuesVisibility}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              title={valuesHidden ? 'Mostrar valores' : 'Ocultar valores'}
            >
              {valuesHidden ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            
            <NotificationBell />

          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#141414] z-50">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-[#262626]">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile?.name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                  <div className="mt-2">
                    <Badge className="text-xs">
                      {profile?.subscription === 'enterprise-annual' ? 'Enterprise Anual' : 
                       profile?.subscription === 'enterprise' ? 'Enterprise' :
                       profile?.subscription === 'premium' ? 'Premium' : 'Free'}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => onTabChange('profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange('subscription')}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Planos
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => onTabChange('admin')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
