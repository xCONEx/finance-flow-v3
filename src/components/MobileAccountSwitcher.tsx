import React, { useState } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Building2, 
  Bell, 
  Plus,
  Crown,
  Users,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface MobileAccountSwitcherProps {
  onAccountChange?: (context: 'individual' | any) => void;
}

const MobileAccountSwitcher: React.FC<MobileAccountSwitcherProps> = ({ 
  onAccountChange 
}) => {
  const {
    currentContext,
    agencies,
    setCurrentContext,
    loading,
    pendingInvitations,
    acceptInvitation,
    rejectInvitation,
    loadPendingInvitations,
    createAgency,
    inviteCollaborator
  } = useAgency();

  const { user, profile, signOut } = useSupabaseAuth();
  const { toast } = useToast();

  const [showCreateAgency, setShowCreateAgency] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newAgencyDescription, setNewAgencyDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creatingAgency, setCreatingAgency] = useState(false);
  const [invitingUser, setInvitingUser] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Buscar agências que o usuário é owner
  const ownedAgencies = agencies.filter(agency => agency.is_owner);
  const memberAgencies = agencies.filter(agency => !agency.is_owner);

  const handleContextChange = (context: 'individual' | any) => {
    setCurrentContext(context);
    onAccountChange?.(context);
    setSheetOpen(false);
    
    toast({
      title: "Conta Alterada",
      description: context === 'individual' 
        ? "Modo individual ativado" 
        : `Agora você está em: ${context.name}`,
    });
  };

  const handleCreateAgency = async () => {
    if (!newAgencyName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da agência é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setCreatingAgency(true);
    try {
      const success = await createAgency(newAgencyName, newAgencyDescription);
      if (success) {
        setShowCreateAgency(false);
        setNewAgencyName('');
        setNewAgencyDescription('');
      }
    } finally {
      setCreatingAgency(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !currentContext || currentContext === 'individual') {
      toast({
        title: "Erro",
        description: "Email é obrigatório e você deve estar em uma agência",
        variant: "destructive"
      });
      return;
    }

    setInvitingUser(true);
    try {
      const success = await inviteCollaborator(currentContext.id, inviteEmail);
      if (success) {
        setShowInviteDialog(false);
        setInviteEmail('');
      }
    } finally {
      setInvitingUser(false);
    }
  };

  const getCurrentContextLabel = () => {
    if (currentContext === 'individual') {
      return 'Individual';
    }
    return currentContext?.name || 'Selecionar Conta';
  };

  const getCurrentContextIcon = () => {
    if (currentContext === 'individual') {
      return <User className="h-5 w-5" />;
    }
    return <Building2 className="h-5 w-5" />;
  };

  const getCurrentContextBadge = () => {
    if (currentContext === 'individual') {
      return null;
    }
    
    const agency = agencies.find(a => a.id === currentContext?.id);
    if (!agency) return null;

    return (
      <Badge variant="outline" className="text-xs">
        {agency.is_owner ? 'Owner' : agency.user_role}
      </Badge>
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSheetOpen(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-14 text-left bg-white dark:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getCurrentContextIcon()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">
                    {getCurrentContextLabel()}
                  </span>
                  {getCurrentContextBadge()}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[80vh] max-h-[600px]">
          <SheetHeader>
            <SheetTitle className="text-left">Trocar Conta</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-full">
            {/* User Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{profile?.name || user?.email?.split('@')[0]}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <Badge className="mt-1">
                    {profile?.subscription === 'enterprise-annual' ? 'Enterprise Anual' : 
                     profile?.subscription === 'enterprise' ? 'Enterprise' :
                     profile?.subscription === 'premium' ? 'Premium' : 'Free'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Accounts List */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {/* Individual Account */}
              <Button
                variant={currentContext === 'individual' ? 'default' : 'outline'}
                className="w-full justify-start h-16 p-4"
                onClick={() => handleContextChange('individual')}
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Conta Individual</div>
                    <div className="text-sm text-gray-500">Seus projetos pessoais</div>
                  </div>
                  {currentContext === 'individual' && (
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                  )}
                </div>
              </Button>

              {/* Owned Agencies */}
              {ownedAgencies.length > 0 && (
                <>
                  <div className="text-sm font-medium text-gray-500 px-2 mt-4">
                    Suas Empresas
                  </div>
                  {ownedAgencies.map((agency) => (
                    <Button
                      key={agency.id}
                      variant={currentContext !== 'individual' && currentContext?.id === agency.id ? 'default' : 'outline'}
                      className="w-full justify-start h-16 p-4"
                      onClick={() => handleContextChange(agency)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            <Crown className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="font-semibold">{agency.name}</div>
                          <div className="text-sm text-gray-500">Proprietário</div>
                        </div>
                        {currentContext !== 'individual' && currentContext?.id === agency.id && (
                          <div className="h-3 w-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </Button>
                  ))}
                </>
              )}

              {/* Member Agencies */}
              {memberAgencies.length > 0 && (
                <>
                  <div className="text-sm font-medium text-gray-500 px-2 mt-4">
                    Empresas Participante
                  </div>
                  {memberAgencies.map((agency) => (
                    <Button
                      key={agency.id}
                      variant={currentContext !== 'individual' && currentContext?.id === agency.id ? 'default' : 'outline'}
                      className="w-full justify-start h-16 p-4"
                      onClick={() => handleContextChange(agency)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-600">
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="font-semibold">{agency.name}</div>
                          <div className="text-sm text-gray-500">{agency.user_role}</div>
                        </div>
                        {currentContext !== 'individual' && currentContext?.id === agency.id && (
                          <div className="h-3 w-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </Button>
                  ))}
                </>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowCreateAgency(true)}
              >
                <Plus className="h-4 w-4 mr-3" />
                Criar Nova Empresa
              </Button>

              {currentContext !== 'individual' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <Users className="h-4 w-4 mr-3" />
                  Convidar Colaborador
                </Button>
              )}

              {pendingInvitations.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <Bell className="h-4 w-4 mr-3" />
                  Convites Pendentes ({pendingInvitations.length})
                </Button>
              )}

              <Separator />

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSheetOpen(false);
                  // Navigate to settings
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                Configurações
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal Criar Agência */}
      <Dialog open={showCreateAgency} onOpenChange={setShowCreateAgency}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agency-name">Nome da Empresa</Label>
              <Input
                id="agency-name"
                value={newAgencyName}
                onChange={(e) => setNewAgencyName(e.target.value)}
                placeholder="Digite o nome da empresa"
              />
            </div>
            <div>
              <Label htmlFor="agency-description">Descrição (opcional)</Label>
              <Textarea
                id="agency-description"
                value={newAgencyDescription}
                onChange={(e) => setNewAgencyDescription(e.target.value)}
                placeholder="Breve descrição da empresa"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateAgency}
                disabled={creatingAgency || !newAgencyName.trim()}
                className="flex-1"
              >
                {creatingAgency ? 'Criando...' : 'Criar Empresa'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateAgency(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Convites */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingInvitations.length > 0 ? 'Convites Pendentes' : 'Convidar Colaborador'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingInvitations.length > 0 ? (
              // Lista de convites pendentes
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="border rounded-lg p-3 bg-blue-50">
                    <div className="font-medium text-blue-900">{invitation.agency_name}</div>
                    <div className="text-xs text-gray-600 mb-2">
                      Convidado por {invitation.invited_by_name}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          await acceptInvitation(invitation.id);
                          await loadPendingInvitations();
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await rejectInvitation(invitation.id);
                          await loadPendingInvitations();
                        }}
                      >
                        Recusar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Formulário para convidar
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-email">Email do Colaborador</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colaborador@exemplo.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleInviteUser}
                    disabled={invitingUser || !inviteEmail.trim()}
                    className="flex-1"
                  >
                    {invitingUser ? 'Enviando...' : 'Enviar Convite'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteDialog(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileAccountSwitcher; 