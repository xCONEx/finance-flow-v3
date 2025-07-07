import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface MobileAccountSwitcherProps {
  onOpenModal: () => void;
}

const MobileAccountSwitcher: React.FC<MobileAccountSwitcherProps> = ({ onOpenModal }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpenModal}
      className="flex items-center gap-2 p-2"
    >
      <User className="h-4 w-4" />
      <span className="hidden sm:inline">Trocar Conta</span>
    </Button>
  );
};

export default MobileAccountSwitcher; 