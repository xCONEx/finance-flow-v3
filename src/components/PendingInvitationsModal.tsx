import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAgency } from '@/contexts/AgencyContext';
import { notificationService, createNotification } from '@/services/notificationService';
import { Building2 } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const PendingInvitationsModal: React.FC = () => {
  const { pendingInvitations, acceptInvitation, loadPendingInvitations } = useAgency();
  const { user } = useSupabaseAuth();
  const [open, setOpen] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (pendingInvitations.length > 0) {
      setOpen(true);
      if (!notified) {
        const invite = pendingInvitations[0];
        if (invite && invite.id && invite.agency_id && invite.agency_name && user?.id) {
          createNotification({
            user_id: user.id,
            type: 'invite',
            title: 'Convite para Agência',
            body: `Você foi convidado para a agência: ${invite.agency_name}`,
            data: { agencyId: invite.agency_id, invitationId: invite.id },
            is_read: false
          });
        }
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

export default PendingInvitationsModal; 