
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  LogOut, 
  Settings, 
  Crown, 
  Users,
  Home,
  Calculator,
  Video,
  CreditCard,
  UserCheck,
  Building,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showTeamOption?: boolean;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, showTeamOption }) => {
  const { signOut, user, profile } = useSupabaseAuth();
  const { currentTheme } = useTheme();
  const { valuesHidden, toggleValuesVisibility } = usePrivacy();
  const isAdmin = profile?.user_type === 'admin';

  const handleLogout = async () => {
    await signOut();
  };

  const hasEnterprisePlan = profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual';
  const hasPremiumPlan = ['premium', 'enterprise', 'enterprise-annual'].includes(profile?.subscription);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    ...(hasEnterprisePlan ? [{ id: 'kanban', label: 'Projetos', icon: Video }] : []),
    ...(hasPremiumPlan ? [{ id: 'financial', label: 'Financeiro', icon: CreditCard }] : []),
    ...(hasPremiumPlan ? [{ id: 'clients', label: 'Clientes', icon: UserCheck }] : []),
    { id: 'management', label: 'Gerenciamento', icon: Building },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${currentTheme.primary} flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">FF</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Finance Flow
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`flex items-center space-x-2 ${
                  activeTab === item.id 
                    ? `bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90` 
                    : `hover:bg-gradient-to-r hover:${currentTheme.secondary}`
                }`}
                onClick={() => onTabChange(item.id)}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            ))}

            {/* Team Option */}
            {showTeamOption && (
              <Button
                variant="ghost"
                className={`flex items-center space-x-2 ${
                  activeTab === 'team' 
                    ? `bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90` 
                    : `hover:bg-gradient-to-r hover:${currentTheme.secondary}`
                }`}
                onClick={() => onTabChange('team')}
              >
                <Users className="w-4 h-4" />
                <span>Equipe</span>
              </Button>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* Privacy Toggle */}
            <Button
              variant="ghost"
              size="sm"
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
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                    <AvatarFallback className={`bg-gradient-to-r ${currentTheme.primary} text-white`}>
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.subscription === 'free' ? 'Plano Gratuito' : 
                     profile?.subscription === 'premium' ? 'Plano Premium' : 
                     'Plano Enterprise'}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTabChange('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange('subscription')}>
                  <Crown className="mr-2 h-4 w-4" />
                  <span>Assinatura</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => onTabChange('admin')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
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
