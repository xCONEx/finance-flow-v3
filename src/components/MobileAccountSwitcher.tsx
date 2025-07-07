import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, UserPlus } from 'lucide-react';

interface MobileAccountSwitcherProps {
  accounts: string[];
  currentEmail: string;
  onSwitch: (email: string) => void;
  onRemove: (email: string) => void;
  onAdd: () => void;
}

const MobileAccountSwitcher: React.FC<MobileAccountSwitcherProps> = ({ accounts, currentEmail, onSwitch, onRemove, onAdd }) => {
  return (
    <div className="py-2">
      <div className="text-xs text-gray-500 px-3 pb-1">Contas Recentes</div>
      {accounts.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-500">Nenhuma conta recente</div>
      )}
      {accounts.map(email => (
        <div key={email} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer group">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarFallback>{email.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className={`flex-1 text-sm truncate ${email === currentEmail ? 'font-bold text-blue-600' : ''}`}>{email}</span>
          {email !== currentEmail && (
            <Button size="icon" variant="ghost" className="ml-2" onClick={() => onSwitch(email)} title="Trocar para esta conta">
              Entrar
            </Button>
          )}
          <Button size="icon" variant="ghost" className="ml-1 opacity-60 group-hover:opacity-100" onClick={() => onRemove(email)} title="Remover conta">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="px-3 pt-2">
        <Button variant="outline" className="w-full flex items-center gap-2" onClick={onAdd}>
          <UserPlus className="h-4 w-4" />
          Adicionar Conta
        </Button>
      </div>
    </div>
  );
};

export default MobileAccountSwitcher; 
