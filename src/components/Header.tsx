
import React from 'react';
import { Shield, Settings, Eye, EyeOff, Home, Calculator, Video, DollarSign, Package, Calendar, Users, Building2, User as UserIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useAgency } from '../contexts/AgencyContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showTeamOption?: boolean;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, showTeamOption }) => {
  const { user, profile, agency } = useSupabaseAuth();
  const { currentTheme } = useTheme();
  const { valuesHidden, toggleValuesVisibility } = usePrivacy();
  const { agencies, currentContext, setCurrentContext } = useAgency();

  const isAdmin = profile?.user_type === 'admin';
  const hasEnterprisePlan = profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual';

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    ...(hasEnterprisePlan ? [{ id: 'kanban', label: 'Projetos', icon: Video }] : []),
    { id: 'costs', label: 'Custos', icon: DollarSign },
    { id: 'items', label: 'Itens', icon: Package },
    { id: 'routine', label: 'Rotina', icon: Calendar },
    ...(showTeamOption ? [{ id: 'team', label: 'Equipe', icon: Users }] : []),
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
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <div className={`w-8 h-8 bg-gradient-to-r ${currentTheme.primary} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">FF</span>
              </div>
          </div>
          <span className={`font-bold text-xl bg-gradient-to-r ${currentTheme.primary} bg-clip-text text-transparent hidden sm:block`}>
                FinanceFlow
              </span>
        </div>

        {/* Menu de navegação (só desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              size="sm"
              className={`flex items-center gap-2 transition-colors ${
                activeTab === item.id 
                  ? `bg-gradient-to-r ${currentTheme.primary} text-white hover:opacity-90` 
                  : `hover:bg-gradient-to-r hover:${currentTheme.secondary} hover:text-${currentTheme.accent}`
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden xl:block">{item.label}</span>
            </Button>
          ))}
        </nav>

        {/* Ações */}
        <div className="flex items-center gap-2">
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

          {isAdmin && (
            <Button
              variant={activeTab === 'admin' ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange('admin')}
              className="flex"
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleValuesVisibility}
            title={valuesHidden ? "Mostrar valores" : "Ocultar valores"}
            className="flex"
          >
            {valuesHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>

          <Button
            variant={activeTab === 'settings' ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange('settings')}
            className="flex"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            variant={activeTab === 'profile' ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange('profile')}
            className="p-1"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={getProfileImageUrl()} alt={profile?.name || user?.email || 'User'} />
              <AvatarFallback className={`bg-gradient-to-r ${currentTheme.primary} text-white`}>
                {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
