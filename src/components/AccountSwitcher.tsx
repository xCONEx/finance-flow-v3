import React, { useState, useEffect } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronDown, 
  User, 
  Building2, 
  Bell, 
  Plus,
  Settings,
  LogOut,
  UserPlus,
  Crown,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AccountSwitcherProps {
  variant?: 'header' | 'mobile';
  onAccountChange?: (context: 'individual' | any) => void;
}

const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ 
  variant = 'header',
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

  const { user, profile } = useSupabaseAuth();
  const { toast } = useToast();

  const [showCreateAgency, setShowCreateAgency] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newAgencyDescription, setNewAgencyDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creatingAgency, setCreatingAgency] = useState(false);
  const [invitingUser, setInvitingUser] = useState(false);

  // Buscar agências que o usuário é owner
  const ownedAgencies = agencies.filter(agency => agency.is_owner);
  const memberAgencies = agencies.filter(agency => !agency.is_owner);

  const handleContextChange = (context: 'individual' | any) => {
    setCurrentContext(context);
    onAccountChange?.(context);
    
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
      return <User className="h-4 w-4" />;
    }
    return <Building2 className="h-4 w-4" />;
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

  if (variant === 'mobile') {
    return (
      <div className="w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between h-12 text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {getCurrentContextIcon()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {getCurrentContextLabel()}
                    </span>
                    {getCurrentContextBadge()}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="start" className="w-full max-w-sm">
            <DropdownMenuLabel className="text-xs text-gray-500">
              Contas Disponíveis
            </DropdownMenuLabel>
            
            {/* Conta Individual */}
            <DropdownMenuItem
              onClick={() => handleContextChange('individual')}
              className="flex items-center gap-3 p-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">Conta Individual</div>
                <div className="text-xs text-gray-500">Seus projetos pessoais</div>
              </div>
              {currentContext === 'individual' && (
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              )}
            </DropdownMenuItem>

            {/* Agências Owned */}
            {ownedAgencies.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500">
                  Suas Empresas
                </DropdownMenuLabel>
                {ownedAgencies.map((agency) => (
                  <DropdownMenuItem
                    key={agency.id}
                    onClick={() => handleContextChange(agency)}
                    className="flex items-center gap-3 p-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <Crown className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{agency.name}</div>
                      <div className="text-xs text-gray-500">Proprietário</div>
                    </div>
                    {currentContext !== 'individual' && currentContext?.id === agency.id && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Agências Member */}
            {memberAgencies.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500">
                  Empresas Participante
                </DropdownMenuLabel>
                {memberAgencies.map((agency) => (
                  <DropdownMenuItem
                    key={agency.id}
                    onClick={() => handleContextChange(agency)}
                    className="flex items-center gap-3 p-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        <Users className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{agency.name}</div>
                      <div className="text-xs text-gray-500">{agency.user_role}</div>
                    </div>
                    {currentContext !== 'individual' && currentContext?.id === agency.id && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Ações */}
            <DropdownMenuSeparator />
            
            {/* Criar Nova Empresa */}
            <DropdownMenuItem
              onClick={() => setShowCreateAgency(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Nova Empresa
            </DropdownMenuItem>

            {/* Convidar Usuário (se estiver em uma agência) */}
            {currentContext !== 'individual' && (
              <DropdownMenuItem
                onClick={() => setShowInviteDialog(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Convidar Colaborador
              </DropdownMenuItem>
            )}

            {/* Convites Pendentes */}
            {pendingInvitations.length > 0 && (
              <DropdownMenuItem
                onClick={() => setShowInviteDialog(true)}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Convites Pendentes ({pendingInvitations.length})
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
      </div>
    );
  }

  // Versão para header (mais compacta)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>
              {getCurrentContextIcon()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium">
            {getCurrentContextLabel()}
          </span>
          {getCurrentContextBadge()}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Trocar Conta</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => handleContextChange('individual')}>
          <User className="mr-2 h-4 w-4" />
          Individual
          {currentContext === 'individual' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
          )}
        </DropdownMenuItem>

        {agencies.map((agency) => (
          <DropdownMenuItem
            key={agency.id}
            onClick={() => handleContextChange(agency)}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">{agency.name}</div>
              <div className="text-xs text-gray-500">
                {agency.is_owner ? 'Owner' : agency.user_role}
              </div>
            </div>
            {currentContext !== 'individual' && currentContext?.id === agency.id && (
              <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setShowCreateAgency(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Empresa
        </DropdownMenuItem>

        {pendingInvitations.length > 0 && (
          <DropdownMenuItem onClick={() => setShowInviteDialog(true)}>
            <Bell className="mr-2 h-4 w-4" />
            Convites ({pendingInvitations.length})
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountSwitcher; 