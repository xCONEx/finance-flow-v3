
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap, Building } from 'lucide-react';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';

interface PremiumFeatureBlockProps {
  feature: string;
  requiredPlan: 'basic' | 'premium' | 'enterprise';
  children?: React.ReactNode;
  className?: string;
}

const planIcons = {
  basic: Zap,
  premium: Crown,
  enterprise: Building,
};

const planNames = {
  basic: 'Básico',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

const planColors = {
  basic: 'bg-green-100 text-green-800',
  premium: 'bg-blue-100 text-blue-800',
  enterprise: 'bg-purple-100 text-purple-800',
};

export const PremiumFeatureBlock: React.FC<PremiumFeatureBlockProps> = ({
  feature,
  requiredPlan,
  children,
  className = '',
}) => {
  const { subscription, isFreePlan } = useSubscriptionPermissions();
  
  const hasAccess = () => {
    if (requiredPlan === 'basic') {
      return ['basic', 'premium', 'enterprise', 'enterprise-annual'].includes(subscription);
    }
    if (requiredPlan === 'premium') {
      return ['premium', 'enterprise', 'enterprise-annual'].includes(subscription);
    }
    if (requiredPlan === 'enterprise') {
      return ['enterprise', 'enterprise-annual'].includes(subscription);
    }
    return false;
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  const IconComponent = planIcons[requiredPlan];

  return (
    <Card className={`${className} border-dashed border-2 border-gray-300`}>
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-gray-400" />
        </div>
        <CardTitle className="text-xl text-gray-600">
          Recurso Premium Bloqueado
        </CardTitle>
        <p className="text-gray-500">{feature}</p>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge className={planColors[requiredPlan]}>
            <IconComponent className="h-4 w-4 mr-1" />
            Requer plano {planNames[requiredPlan]}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600">
          Faça upgrade para desbloquear este recurso e muito mais!
        </p>
        
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
          onClick={() => {
            // Redirecionar para página de assinaturas
            window.location.hash = '#/subscription';
          }}
        >
          <Crown className="h-4 w-4 mr-2" />
          Fazer Upgrade
        </Button>
        
        {isFreePlan && (
          <p className="text-xs text-gray-500">
            Você está no plano gratuito. Upgrade disponível a partir de R$ 29/mês.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PremiumFeatureBlock;
