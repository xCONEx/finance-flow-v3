
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, Users, Building, Settings, DollarSign, BarChart, FileText, Shield, Bell, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const AnimatedSidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: Building, label: 'Empresas', path: '/company-management' },
    { icon: DollarSign, label: 'Financeiro', path: '/financial' },
    { icon: BarChart, label: 'Relatórios', path: '/reports' },
    { icon: FileText, label: 'Contratos', path: '/contracts' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '4rem' }
  };

  const itemVariants = {
    expanded: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "tween", 
        ease: "easeOut", 
        duration: 0.2 
      }
    },
    collapsed: { 
      opacity: 0, 
      x: -10,
      transition: { 
        type: "tween", 
        ease: "easeIn", 
        duration: 0.1 
      }
    }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 shadow-lg h-screen flex flex-col border-r border-gray-200 dark:border-gray-700"
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.h1
              className="text-xl font-bold text-gray-800 dark:text-gray-200"
              variants={itemVariants}
              animate={isCollapsed ? 'collapsed' : 'expanded'}
            >
              Sistema
            </motion.h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <motion.button
              key={item.path}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <motion.span
                  className="font-medium"
                  variants={itemVariants}
                  animate={isCollapsed ? 'collapsed' : 'expanded'}
                >
                  {item.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </nav>
    </motion.div>
  );
};

export default AnimatedSidebar;
