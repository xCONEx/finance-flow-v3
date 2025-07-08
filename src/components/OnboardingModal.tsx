import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../integrations/supabase/client';

const steps = [
  {
    title: 'Configurar Rotina',
    description: 'Defina sua rotina de trabalho para calcular corretamente seus valores.',
    actionLabel: 'Ir para Gerenciamento',
  },
  {
    title: 'Adicionar Itens',
    description: 'Adicione itens de trabalho que você utiliza no dia a dia.',
    actionLabel: undefined,
  },
  {
    title: 'Adicionar Equipamentos',
    description: 'Cadastre seus equipamentos para controle de custos e depreciação.',
    actionLabel: undefined,
  },
  {
    title: 'Adicionar Clientes',
    description: 'Cadastre pelo menos um cliente para começar a usar o sistema.',
    actionLabel: undefined,
  },
];

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStep?: number;
  onNavigateTab: (tabId: string) => void;
}

const stepTabMap = [
  'management', // Rotina
  'management', // Itens
  'management', // Equipamentos
  'clients',    // Clientes
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onOpenChange, initialStep = 1, onNavigateTab }) => {
  const { user, profile, updateProfile } = useSupabaseAuth();
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (profile?.onboarding_step && profile.onboarding_step !== step) {
      setStep(profile.onboarding_step);
    }
  }, [profile]);

  const saveProgress = async (newStep: number, completed = false) => {
    if (!user) return;
    setLoading(true);
    await updateProfile({
      onboarding_step: newStep,
      onboarding_completed: completed,
    });
    setLoading(false);
  };

  const handleNext = async () => {
    if (step < steps.length) {
      setStep(step + 1);
      await saveProgress(step + 1);
    } else {
      await saveProgress(steps.length, true);
      setCompleted(true);
      onOpenChange(false);
    }
  };

  const handleSkip = async () => {
    if (step < steps.length) {
      setStep(step + 1);
      await saveProgress(step + 1);
    } else {
      await saveProgress(steps.length, true);
      setCompleted(true);
      onOpenChange(false);
    }
  };

  const handleRestart = async () => {
    setStep(1);
    setCompleted(false);
    await saveProgress(1, false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao FinanceFlow!</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Progress value={(step / steps.length) * 100} />
          <div className="mt-2">
            <h2 className="text-xl font-bold mb-2">{steps[step - 1].title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{steps[step - 1].description}</p>
            {steps[step - 1].actionLabel && (
              <Button
                variant="outline"
                className="mb-2 w-full"
                disabled={loading}
                onClick={() => onNavigateTab(stepTabMap[step - 1])}
              >
                {steps[step - 1].actionLabel}
              </Button>
            )}
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="ghost" onClick={handleRestart} disabled={loading}>
              Começar novamente
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSkip} disabled={loading}>
                Pular
              </Button>
              <Button onClick={async () => {
                if (step === steps.length) {
                  await handleNext();
                  onNavigateTab('dashboard');
                } else {
                  await handleNext();
                }
              }} disabled={loading}>
                {step === steps.length ? 'Finalizar' : 'Próximo'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal; 
