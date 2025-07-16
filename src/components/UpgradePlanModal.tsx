import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePlanModalProps {
  open: boolean;
  onClose: () => void;
  type?: 'jobs' | 'projects';
  onUpgradeClick?: () => void;
}

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ open, onClose, type = 'jobs', onUpgradeClick }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    if (typeof onUpgradeClick === 'function') {
      onUpgradeClick();
    } else {
      navigate('/subscription');
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Crown className="h-5 w-5 text-yellow-500" />
            Limite do Plano Atingido
          </DialogTitle>
          <DialogDescription className="pt-2 text-gray-700 dark:text-gray-300">
            Você atingiu o limite mensal do seu plano atual.<br />
            Para continuar criando {type === 'jobs' ? 'jobs' : 'projetos'}, faça upgrade para um plano superior.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-2 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white" onClick={handleUpgrade}>
            <Crown className="h-4 w-4 mr-2" />
            Ver Planos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePlanModal; 
