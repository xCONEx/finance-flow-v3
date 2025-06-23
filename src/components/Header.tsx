
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Settings, 
  Eye, 
  EyeOff, 
  Home, 
  Calculator, 
  Video, 
  DollarSign, 
  Package, 
  Calendar, 
  Users, 
  Building2, 
  User as UserIcon, 
  ChevronDown, 
  CreditCard,
  User,
  LogOut,
  Crown,
  FileText
} from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useAgency } from '../contexts/AgencyContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useTheme } from '../contexts/ThemeContext';
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
  const { agencies, currentContext, setCurrentContext } = useAgency();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
    ...(hasPremiumPlan ? [{ id: 'clients', label: 'Clientes', icon: UserIcon }] : []),
    { id: 'routine', label: 'Rotina', icon: Calendar },
  ];

  const managementMenuItems = [
    { id: 'costs', label: 'Custos Mensais', icon: DollarSign },
    { id: 'items', label: 'Itens de Trabalho', icon: Package },
  ];

  const getProfileImageUrl = () => {
    if (profile?.image_user) return profile.image_user;
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
    return '';
  };

  const handleContextChange = (value: string) => {
    if (value === 'individual') {
      setCurrentContext('individual');
    } else {
      const agency = agencies.find(a => a.id === value);
      if (agency) {
        setCurrentContext(agency);
      }
    }
  };

  const getCurrentContextValue = () => {
    return currentContext === 'individual' ? 'individual' : currentContext.id;
  };

  const getCurrentContextLabel = () => {
    if (currentContext === 'individual') {
      return (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span>Individual</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        <span className="truncate max-w-[120px]">{currentContext.name}</span>
        {currentContext.is_owner && (
          <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded flex-shrink-0">Owner</span>
        )}
      </div>
    );
  };

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

            {/* Submenu Gerenciamento */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex items-center space-x-2 ${
                    ['costs', 'items'].includes(activeTab)
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90` 
                      : `hover:bg-gradient-to-r hover:${currentTheme.secondary}`
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Gerenciamento</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {managementMenuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
            {/* Seletor de Contexto Individual/Empresa */}
            {hasEnterprisePlan && agencies.length > 0 && (
              <Select value={getCurrentContextValue()} onValueChange={handleContextChange}>
                <SelectTrigger className="w-auto min-w-[120px] max-w-[160px] h-9">
                  <SelectValue>
                    {getCurrentContextLabel()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      <span>Individual</span>
                    </div>
                  </SelectItem>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate max-w-[100px]">{agency.name}</span>
                        {agency.is_owner && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded ml-1 flex-shrink-0">
                            Owner
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Privacy Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleValuesVisibility}
              title={valuesHidden ? "Mostrar valores" : "Ocultar valores"}
              className="flex"
            >
              {valuesHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>

            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getProfileImageUrl()} alt={user?.email} />
                    <AvatarFallback className={`bg-gradient-to-r ${currentTheme.primary} text-white`}>
                      {profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
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
