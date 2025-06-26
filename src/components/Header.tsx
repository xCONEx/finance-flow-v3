
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
import ContextSelector from './ContextSelector';


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
                        {/* Context Selector */}
            <ContextSelector />
            
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-3">
  {menuItems.map((item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <div key={item.id} className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full transition-colors ${
            isActive
              ? `${currentTheme.primary} text-white`
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
          }`}
          onClick={() => onTabChange(item.id)}
        >
          <Icon className="h-5 w-5" />
        </Button>
        <div className="absolute bottom-[-28px] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
          {item.label}
        </div>
      </div>
    );
  })}

  {showTeamOption && (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon"
        className={`h-10 w-10 rounded-full transition-colors ${
          activeTab === 'team'
            ? `${currentTheme.primary} text-white`
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
        }`}
        onClick={() => onTabChange('team')}
      >
        <Users className="h-5 w-5" />
      </Button>
      <div className="absolute bottom-[-28px] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
        Equipe
      </div>
    </div>
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
              <DropdownMenuContent className="w-auto p-2" align="end" forceMount>
  <div className="flex items-center justify-center flex-col gap-2 px-2 pt-2">
    <Avatar className="h-12 w-12">
      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
      <AvatarFallback className={`bg-gradient-to-r ${currentTheme.primary} text-white`}>
        {user?.email?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="text-center">
      <p className="text-sm font-medium">{user?.email}</p>
      <p className="text-xs text-muted-foreground">
        {profile?.subscription === 'free' ? 'Plano Gratuito' : 
         profile?.subscription === 'premium' ? 'Plano Premium' : 
         'Plano Enterprise'}
      </p>
    </div>
  </div>

  <DropdownMenuSeparator />

  {/* Ícones de opções */}
  <div className="grid grid-cols-3 gap-2 p-2">
    {[
      { id: 'profile', icon: User, label: 'Perfil' },
      { id: 'settings', icon: Settings, label: 'Configurações' },
      { id: 'subscription', icon: Crown, label: 'Assinatura' },
      ...(isAdmin ? [{ id: 'admin', icon: FileText, label: 'Admin' }] : []),
    ].map(({ id, icon: Icon, label }) => {
      const isActive = activeTab === id;
      return (
        <div key={id} className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-full ${
              isActive
                ? `${currentTheme.primary} text-white`
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
            }`}
            onClick={() => onTabChange(id)}
          >
            <Icon className="w-5 h-5" />
          </Button>
          <div className="absolute bottom-[-28px] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
            {label}
          </div>
        </div>
      );
    })}
  </div>

  <DropdownMenuSeparator />

  <div className="flex justify-center p-2">
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      className="text-red-600 hover:text-red-800"
      title="Sair"
    >
      <LogOut className="w-5 h-5" />
    </Button>
  </div>
</DropdownMenuContent>

            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
