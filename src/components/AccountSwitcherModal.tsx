import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useRecentAccounts } from '../hooks/useRecentAccounts';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { LogOut, Plus, X, User } from 'lucide-react';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose
}) => {
  const { accounts, removeAccount, clearAccounts } = useRecentAccounts();
  const { user, signOut } = useSupabaseAuth();

  const handleSwitchAccount = async (email: string) => {
    await signOut();
    // Redirecionar para login com o email selecionado
    window.location.href = `/login?email=${encodeURIComponent(email)}`;
  };

  const handleRemoveAccount = (email: string) => {
    removeAccount(email);
  };

  const handleAddAccount = () => {
    onClose();
    window.location.href = '/login';
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const isCurrentAccount = (email: string) => {
    return user?.email === email;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Trocar de Conta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conta Atual */}
          {user && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Conta Atual
              </h3>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.user_metadata?.full_name || 'Usuário'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Atual
                </Badge>
              </div>
            </div>
          )}

          {/* Contas Recentes */}
          {accounts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Contas Recentes
              </h3>
              <div className="space-y-2">
                {accounts
                  .filter(email => email !== user?.email)
                  .map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {getInitials(email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Usuário
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSwitchAccount(email)}
                          className="h-8 px-2"
                        >
                          Trocar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAccount(email)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Ações */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAddAccount}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nova Conta
            </Button>
            
            {accounts.length > 0 && (
              <Button
                onClick={clearAccounts}
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-destructive"
              >
                Limpar Histórico
              </Button>
            )}

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 