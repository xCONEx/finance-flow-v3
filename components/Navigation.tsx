
import React, { useState } from 'react';
import { Home, Calculator, Kanban, Users, Settings as SettingsIcon, DollarSign, Briefcase, Clock, Menu, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { user, agencyData } = useAuth();
  const { currentTheme } = useTheme();
  const { valuesHidden, toggleValuesVisibility } = usePrivacy();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'costs', label: 'Custos', icon: DollarSign },
    { id: 'items', label: 'Itens', icon: Briefcase },
    { id: 'routine', label: 'Rotina', icon: Clock }
  ];

  // Menu empresa só aparece se o usuário faz parte de uma empresa
  const companyTabs = [
    { id: 'kanban', label: 'Projetos', icon: Kanban },
    { id: 'team', label: 'Equipe', icon: Users }
  ];

  const isCompanyUser = (user?.userType === 'company_owner' || user?.userType === 'employee') && !!agencyData;
  const isAdmin = user?.userType === 'admin';

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 bg-gradient-to-r ${currentTheme.primary} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">FF</span>
              </div>
              <span className={`font-bold text-xl bg-gradient-to-r ${currentTheme.primary} bg-clip-text text-transparent`}>
                FinanceFlow
              </span>

              {/* Company Menu - só aparece se usuário faz parte de empresa */}
              {isCompanyUser && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="h-5 w-5 mr-2" />
                      Empresa
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64">
                    <div className="space-y-4 py-4">
                      <h3 className="font-semibold text-lg">Menu Empresa</h3>
                      <p className="text-sm text-gray-600">{agencyData?.name || 'Sua Empresa'}</p>
                      {companyTabs.map((tab) => (
                        <Button
                          key={tab.id}
                          variant={activeTab === tab.id ? "default" : "ghost"}
                          onClick={() => handleTabChange(tab.id)}
                          className="w-full justify-start"
                        >
                          <tab.icon className="h-4 w-4 mr-2" />
                          {tab.label}
                        </Button>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Admin Menu */}
              {isAdmin && (
                <Button
                  variant={activeTab === 'admin' ? "default" : "ghost"}
                  onClick={() => handleTabChange('admin')}
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    activeTab === 'admin' 
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white` 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span className="hidden lg:inline">Admin</span>
                </Button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1">
              {mainTabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => onTabChange(tab.id)}
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    activeTab === tab.id 
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white` 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{tab.label}</span>
                </Button>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleValuesVisibility}
                title={valuesHidden ? "Mostrar valores" : "Ocultar valores"}
              >
                {valuesHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTabChange('settings')}
                className={activeTab === 'settings' ? `bg-gradient-to-r ${currentTheme.primary} text-white` : ''}
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
              
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => onTabChange('profile')}>
                <AvatarImage src={user?.photoURL || ''} alt={user?.name || 'User'} />
                <AvatarFallback className={`bg-gradient-to-r ${currentTheme.primary} text-white`}>
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 md:hidden">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="flex items-center space-x-3">
            {(isCompanyUser || isAdmin) && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="space-y-4 py-4">
                    {isCompanyUser && (
                      <>
                        <h3 className="font-semibold text-lg">Menu Empresa</h3>
                        <p className="text-sm text-gray-600">{agencyData?.name || 'Sua Empresa'}</p>
                        {companyTabs.map((tab) => (
                          <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? "default" : "ghost"}
                            onClick={() => handleTabChange(tab.id)}
                            className="w-full justify-start"
                          >
                            <tab.icon className="h-4 w-4 mr-2" />
                            {tab.label}
                          </Button>
                        ))}
                      </>
                    )}
                    
                    {isAdmin && (
                      <>
                        <h3 className="font-semibold text-lg">Admin</h3>
                        <Button
                          variant={activeTab === 'admin' ? "default" : "ghost"}
                          onClick={() => handleTabChange('admin')}
                          className="w-full justify-start"
                        >
                          <SettingsIcon className="h-4 w-4 mr-2" />
                          Painel Admin
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            
            <span className={`font-bold text-lg bg-gradient-to-r ${currentTheme.primary} bg-clip-text text-transparent`}>
              FinanceFlow
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleValuesVisibility}
              title={valuesHidden ? "Mostrar valores" : "Ocultar valores"}
            >
              {valuesHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTabChange('settings')}
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
            
            <Avatar className="h-8 w-8 cursor-pointer" onClick={() => onTabChange('profile')}>
              <AvatarImage src={user?.photoURL || ''} alt={user?.name || 'User'} />
              <AvatarFallback className={`bg-gradient-to-r ${currentTheme.primary} text-white`}>
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="grid grid-cols-5 h-16">
          {mainTabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center h-full rounded-none space-y-1 ${
                activeTab === tab.id ? `text-${currentTheme.accent} bg-gray-50 dark:bg-gray-800` : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-xs">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;
