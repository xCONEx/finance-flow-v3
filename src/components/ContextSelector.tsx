import React, { useEffect, useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { notificationService } from '@/services/notificationService';
import { Mail } from 'lucide-react';

const ContextSelector = () => {
  const {
    currentContext,
    agencies,
    setCurrentContext,
    loading,
    pendingInvitations,
    acceptInvitation,
    rejectInvitation,
    loadPendingInvitations
  } = useAgency();

  const [open, setOpen] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (pendingInvitations.length > 0) {
      setOpen(true);
      if (!notified) {
        const invite = pendingInvitations[0];
        notificationService.showNotification({
          id: `invite-${invite.id}`,
          title: 'Convite para Agência',
          body: `Você foi convidado para a agência: ${invite.agency_name}`,
          type: 'general',
          priority: 'high',
          timestamp: Date.now(),
          isRead: false,
          userId: 'system',
          createdAt: new Date().toISOString(),
          data: { agencyId: invite.agency_id }
        });
        setNotified(true);
      }
    } else {
      setOpen(false);
      setNotified(false);
    }
  }, [pendingInvitations, notified]);

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
          className="flex items-center gap-2 h-9 px-3 hover:bg-muted/60 transition-colors"
          disabled={loading}
        >
          {contextInfo.icon}
          <span className="text-sm font-medium truncate max-w-[100px]">{contextInfo.label}</span>

          {pendingInvitations.length > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-1 py-0 h-4 min-w-4 rounded-full ml-1">
              {pendingInvitations.length}
            </Badge>
          )}

          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72 bg-white">
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
                  <span className="text-sm truncate max-w-[160px]">{agency.name}</span>
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

        {pendingInvitations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Convites Pendentes ({pendingInvitations.length})
            </div>
            <DropdownMenuItem
              onClick={() => setOpen(true)}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Ver Convites
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const PendingInvitationsModal: React.FC = () => {
  const { pendingInvitations, acceptInvitation, loadPendingInvitations } = useAgency();
  const [open, setOpen] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (pendingInvitations.length > 0) {
      setOpen(true);
      if (!notified) {
        const invite = pendingInvitations[0];
        notificationService.showNotification({
          id: `invite-${invite.id}`,
          title: 'Convite para Agência',
          body: `Você foi convidado para a agência: ${invite.agency_name}`,
          type: 'general',
          priority: 'high',
          timestamp: Date.now(),
          isRead: false,
          userId: 'system',
          createdAt: new Date().toISOString(),
          data: { agencyId: invite.agency_id }
        });
        setNotified(true);
      }
    } else {
      setOpen(false);
      setNotified(false);
    }
  }, [pendingInvitations, notified]);

  if (pendingInvitations.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convite para Agência</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {pendingInvitations.map((invitation) => (
            <div key={invitation.id} className="border rounded-lg p-4 flex items-center gap-3 bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium text-blue-900">{invitation.agency_name}</div>
                <div className="text-xs text-gray-600 mb-1">Convidado por {invitation.invited_by_name}</div>
                <div className="text-xs text-gray-500">Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}</div>
              </div>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={async () => {
                  await acceptInvitation(invitation.id);
                  await loadPendingInvitations();
                }}
              >
                Aceitar
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContextSelector;
