
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Building2, UserCheck, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

const InviteAcceptance = () => {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUserInvites();
  }, [user]);

  const loadUserInvites = async () => {
    if (!user?.email) return;
    
    try {
      console.log('Carregando convites para:', user.email);
      setLoading(true);
      
      // Buscar convites no Firebase
      const invites = await firestoreService.getUserInvites(user.email);
      setPendingInvites(invites);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId, companyId) => {
    try {
      console.log('Aceitando convite:', inviteId, companyId);
      
      // Aceitar convite no Firebase
      await firestoreService.acceptInvite(inviteId, user.id, companyId);
      
      setPendingInvites(pendingInvites.filter(invite => invite.id !== inviteId));
      
      toast({
        title: "Sucesso!",
        description: "Você agora faz parte da equipe da empresa!"
      });
      
      // Recarregar dados do usuário
      window.location.reload();
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao aceitar convite",
        variant: "destructive"
      });
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      console.log('Recusando convite:', inviteId);
      
      // Atualizar status do convite para recusado
      await firestoreService.updateInviteStatus(inviteId, 'declined');
      setPendingInvites(pendingInvites.filter(invite => invite.id !== inviteId));
      
      toast({
        title: "Convite recusado",
        description: "O convite foi recusado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao recusar convite:', error);
      toast({
        title: "Erro",
        description: "Erro ao recusar convite",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (pendingInvites.length === 0) {
    return null; // Não mostrar nada se não há convites
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Mail className="h-5 w-5" />
        Convites Pendentes
      </h3>
      
      {pendingInvites.map((invite) => (
        <Card key={invite.id} className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
              Convite para {invite.companyName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Convidado por:</strong> {invite.invitedBy}
              </p>
              <p className="text-sm">
                <strong>Função:</strong> 
                <Badge variant="outline" className="ml-2">{invite.role}</Badge>
              </p>
              <p className="text-sm">
                <strong>Data do convite:</strong> {new Date(invite.sentAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => handleAcceptInvite(invite.id, invite.companyId)}
                className="flex-1"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Aceitar Convite
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => handleDeclineInvite(invite.id)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Recusar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InviteAcceptance;
