
"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Calculator,
  Video,
  CreditCard,
  UserCheck,
  Settings,
  Building,
  ChevronsUpDown,
  UserCircle,
  LogOut,
  Plus,
  UserCog,
  Blocks,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface AnimatedSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween" as const,
  ease: "easeOut",
  duration: 0.2,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export function AnimatedSidebar({ activeTab, onTabChange }: AnimatedSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { profile, agency, signOut } = useSupabaseAuth();
  const { currentTheme } = useTheme();

  const hasEnterprisePlan = profile?.subscription === 'enterprise' || profile?.subscription === 'enterprise-annual';
  const hasPremiumPlan = ['premium', 'enterprise', 'enterprise-annual'].includes(profile?.subscription);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    ...(hasEnterprisePlan ? [{ id: 'kanban', label: 'Projetos', icon: Video }] : []),
    ...(hasPremiumPlan ? [{ id: 'financial', label: 'Financeiro', icon: CreditCard }] : []),
    ...(hasPremiumPlan ? [{ id: 'clients', label: 'Clientes', icon: UserCheck }] : []),
    { id: 'management', label: 'Gerenciamento', icon: Building },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r bg-white dark:bg-gray-900 hidden md:block",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-white dark:bg-gray-900 transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex w-fit items-center gap-2 px-2"
                    >
                      <Avatar className='rounded size-4'>
                        <AvatarFallback>
                          {agency?.name?.charAt(0) || profile?.name?.charAt(0) || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      <motion.li
                        variants={variants}
                        className="flex w-fit items-center gap-2"
                      >
                        {!isCollapsed && (
                          <>
                            <p className="text-sm font-medium">
                              {agency?.name || "EntregaFlow"}
                            </p>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                          </>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => onTabChange('management')}
                      className="flex items-center gap-2"
                    >
                      <UserCog className="h-4 w-4" /> Gerenciar membros
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onTabChange('settings')}
                      className="flex items-center gap-2"
                    >
                      <Blocks className="h-4 w-4" /> Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onTabChange('management')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar ou gerenciar empresa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onTabChange(item.id)}
                          className={cn(
                            "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary text-left",
                            isActive && "bg-muted text-blue-600",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <motion.li variants={variants}>
                            {!isCollapsed && (
                              <div className="flex items-center gap-2">
                                <p className="ml-2 text-sm font-medium">{item.label}</p>
                                {item.id === 'kanban' && hasEnterprisePlan && (
                                  <Badge
                                    className={cn(
                                      "flex h-fit w-fit items-center gap-1.5 rounded border-none bg-blue-50 px-1.5 text-blue-600 dark:bg-blue-700 dark:text-blue-300",
                                    )}
                                    variant="outline"
                                  >
                                    PRO
                                  </Badge>
                                )}
                                {(item.id === 'financial' || item.id === 'clients') && hasPremiumPlan && (
                                  <Badge
                                    className={cn(
                                      "flex h-fit w-fit items-center gap-1.5 rounded border-none bg-green-50 px-1.5 text-green-600 dark:bg-green-700 dark:text-green-300",
                                    )}
                                    variant="outline"
                                  >
                                    PREMIUM
                                  </Badge>
                                )}
                              </div>
                            )}
                          </motion.li>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="flex flex-col p-2">
                <Separator className="w-full mb-2" />
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                        <Avatar className="size-4">
                          <AvatarFallback>
                            {profile?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
                          {!isCollapsed && (
                            <>
                              <p className="text-sm font-medium">
                                {profile?.name || 'Usuário'}
                              </p>
                              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                            </>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5}>
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-6">
                          <AvatarFallback>
                            {profile?.name?.split(' ').map(n => n.charAt(0)).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">
                            {profile?.name || 'Usuário'}
                          </span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {profile?.email || 'usuario@email.com'}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onTabChange('settings')}
                        className="flex items-center gap-2"
                      >
                        <UserCircle className="h-4 w-4" /> Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" /> Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
