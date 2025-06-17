
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
import { ChevronDown, User, Building2, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ContextSelector = () => {
  const { 
    currentContext, 
    agencies, 
    setCurrentContext, 
    loading, 
    pendingInvitations,
    acceptInvitation,
    rejectInvitation 
  } = useAgency();

  // Se não há agências e nem convites, não mostrar o seletor
  if (agencies.length === 0 && pendingInvitations.length === 0) {
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
          className="flex items-center gap-2 h-9 px-3 relative"
          disabled={loading}
        >
          {contextInfo.icon}
          <span className="text-sm font-medium">{contextInfo.label}</span>
          {pendingInvitations.length > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-1 py-0 h-4 min-w-4 rounded-full ml-1">
              {pendingInvitations.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 bg-white">
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
        
        {/* Lista de agências */}
        {agencies.length > 0 && (
          <>
            <DropdownMenuSeparator />
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
          </>
        )}

        {/* Convites pendentes */}
        {pendingInvitations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Convites Pendentes
            </div>
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="px-2 py-2 border-b border-gray-100">
                <div className="flex flex-col gap-2">
                  <div>
                    <div className="text-sm font-medium">{invitation.agency_name}</div>
                    <div className="text-xs text-gray-600">
                      Convidado por {invitation.invited_by_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptInvitation(invitation.id);
                      }}
                    >
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        rejectInvitation(invitation.id);
                      }}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ContextSelector;
