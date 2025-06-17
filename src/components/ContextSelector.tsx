
import React from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, User, Building2 } from 'lucide-react';

const ContextSelector = () => {
  const { currentContext, agencies, setCurrentContext, loading } = useAgency();

  // Se não há agências, não mostrar o seletor
  if (agencies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span>Individual</span>
      </div>
    );
  }

  const getContextLabel = () => {
    if (currentContext === 'individual') {
      return {
        icon: <User className="h-4 w-4" />,
        label: 'Individual'
      };
    } else {
      return {
        icon: <Building2 className="h-4 w-4" />,
        label: currentContext.name
      };
    }
  };

  const contextInfo = getContextLabel();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 h-9 px-3"
          disabled={loading}
        >
          {contextInfo.icon}
          <span className="text-sm font-medium">{contextInfo.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* Contexto Individual */}
        <DropdownMenuItem 
          onClick={() => setCurrentContext('individual')}
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          <span>Individual</span>
          {currentContext === 'individual' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
          )}
        </DropdownMenuItem>
        
        {/* Separador se houver agências */}
        {agencies.length > 0 && <DropdownMenuSeparator />}
        
        {/* Lista de agências */}
        {agencies.map((agency) => (
          <DropdownMenuItem 
            key={agency.id}
            onClick={() => setCurrentContext(agency)}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm">{agency.name}</span>
              <span className="text-xs text-muted-foreground">
                {agency.is_owner ? 'Owner' : agency.user_role}
              </span>
            </div>
            {currentContext !== 'individual' && currentContext.id === agency.id && (
              <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ContextSelector;
