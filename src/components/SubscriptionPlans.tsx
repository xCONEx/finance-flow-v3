
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Building } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSubscription } from '@/hooks/useSubscription';

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: 'para sempre',
    description: 'Ideal para começar',
    icon: <Check className="h-5 w-5" />,
    features: [
      'Até 5 jobs por mês',
      'Dashboard básico',
      'Relatórios simples',
      'Suporte por email'
    ],
    caktoUrl: null,
    popular: false
  },
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 29',
    period: '/mês',
    description: 'Para freelancers',
    icon: <Zap className="h-5 w-5" />,
    features: [
      'Jobs ilimitados',
      'Dashboard completo',
      'Relatórios avançados',
      'Calculadora de preços',
      'Suporte prioritário'
    ],
    caktoUrl: 'https://pay.cakto.com.br/yppzpjc',
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 59',
    period: '/mês',
    description: 'Para pequenos estúdios',
    icon: <Crown className="h-5 w-5" />,
    features: [
      'Tudo do Básico',
      'Até 10 membros da equipe',
      'Colaboração em tempo real',
      'API de integração',
      'Relatórios personalizados',
      'Backup automático'
    ],
    caktoUrl: 'https://pay.cakto.com.br/kesq5cb',
    popular: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'R$ 199',
    period: '/mês',
    description: 'Para grandes estúdios',
    icon: <Building className="h-5 w-5" />,
    features: [
      'Tudo do Premium',
      'Equipe ilimitada',
      'Suporte 24/7',
      'Onboarding dedicado',
      'SLA garantido',
      'Customizações'
    ],
    caktoUrl: 'https://pay.cakto.com.br/34p727v',
    popular: false
  },
  {
    id: 'enterprise-annual',
    name: 'Enterprise Anual',
    price: 'R$ 1.990',
    period: '/ano',
    description: 'Economia de 20%',
    icon: <Building className="h-5 w-5" />,
    features: [
      'Tudo do Enterprise',
      '2 meses grátis',
      'Desconto de 20%',
      'Consultoria inclusa',
      'Treinamento da equipe'
    ],
    caktoUrl: 'https://pay.cakto.com.br/uoxtt9o',
    popular: false,
    badge: 'ECONOMIA'
  }
];

export const SubscriptionPlans: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { subscription, loading } = useSubscription();

  const handlePlanSelect = (plan: typeof plans[0]) => {
    if (!plan.caktoUrl) return;
    
    if (!user) {
      alert('Faça login para assinar um plano');
      return;
    }

    // Adicionar email do usuário à URL da Cakto
    const url = new URL(plan.caktoUrl);
    url.searchParams.set('customer_email', user.email || '');
    url.searchParams.set('customer_name', user.user_metadata?.name || user.email?.split('@')[0] || '');
    
    window.open(url.toString(), '_blank');
  };

  const isCurrentPlan = (planId: string) => {
    return subscription === planId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Escolha seu plano</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Selecione o plano ideal para seu negócio
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${
              isCurrentPlan(plan.id) ? 'bg-primary/5 border-primary' : ''
            }`}
          >
            {plan.badge && (
              <Badge 
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white"
              >
                {plan.badge}
              </Badge>
            )}
            
            {plan.popular && (
              <Badge 
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-white"
              >
                POPULAR
              </Badge>
            )}

            <CardHeader className="text-center pb-4">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                plan.popular ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {plan.icon}
              </div>
              
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan(plan.id) ? (
                <Button className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : plan.id === 'free' ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled
                >
                  Plano Gratuito
                </Button>
              ) : (
                <Button 
                  className="w-full"
                  onClick={() => handlePlanSelect(plan)}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Assinar Agora
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Todos os planos incluem 7 dias de teste grátis</p>
        <p>Cancele a qualquer momento, sem compromisso</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
