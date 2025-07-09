import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Star, Zap } from 'lucide-react';
import { SubscriptionPlan, SubscriptionPlansProps } from '../../types/stripe';

const PlanCard: React.FC<{
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
  loading?: boolean;
}> = ({ plan, isSelected, onSelect, loading = false }) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatInterval = (interval: string) => {
    return interval === 'month' ? 'mês' : 'ano';
  };

  return (
    <Card 
      className={`relative transition-all duration-200 hover:shadow-lg ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
          : 'hover:ring-1 hover:ring-gray-300'
      } ${plan.popular ? 'border-blue-500' : ''}`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white px-3 py-1">
            <Star className="w-3 h-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold">
            {formatPrice(plan.price, plan.currency)}
          </span>
          <span className="text-gray-500">/{formatInterval(plan.interval)}</span>
        </div>
        {plan.description && (
          <CardDescription className="text-sm">
            {plan.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lista de recursos */}
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Botão de seleção */}
        <Button
          onClick={onSelect}
          disabled={loading}
          className={`w-full ${
            isSelected 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processando...
            </>
          ) : isSelected ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Plano Selecionado
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Escolher Plano
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  plans,
  currentPlan,
  onSelectPlan,
  loading = false,
}) => {
  const [isAnnual, setIsAnnual] = useState(false);

  const defaultPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Básico',
      price: 29.90,
      currency: 'BRL',
      interval: 'month',
      stripePriceId: 'price_basic_monthly',
      features: [
        'Até 10 projetos',
        'Kanban básico',
        'Relatórios simples',
        'Suporte por email',
        'Backup automático',
      ],
      description: 'Perfeito para freelancers e pequenas equipes',
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: 59.90,
      currency: 'BRL',
      interval: 'month',
      stripePriceId: 'price_pro_monthly',
      features: [
        'Projetos ilimitados',
        'Kanban avançado',
        'Relatórios detalhados',
        'Suporte prioritário',
        'Integrações avançadas',
        'Time tracking',
        'Templates personalizados',
      ],
      description: 'Ideal para agências e equipes em crescimento',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.90,
      currency: 'BRL',
      interval: 'month',
      stripePriceId: 'price_enterprise_monthly',
      features: [
        'Tudo do Profissional',
        'API personalizada',
        'Suporte 24/7',
        'Onboarding dedicado',
        'SLA garantido',
        'White-label',
        'Relatórios customizados',
      ],
      description: 'Para grandes empresas e necessidades específicas',
    },
    {
      id: 'enterprise-annual',
      name: 'Enterprise Anual',
      price: 999.90,
      currency: 'BRL',
      interval: 'year',
      stripePriceId: 'price_enterprise_annual',
      features: [
        'Tudo do Enterprise +',
        '12 meses pelo preço de 10',
        'Economia de R$ 199/ano',
        'Consultoria estratégica',
        'Treinamento da equipe',
        'Suporte dedicado',
        'Implementação personalizada',
      ],
      description: 'Para grandes empresas com economia anual',
    },
  ];

  // Filtrar planos baseado no toggle anual/mensal
  const getDisplayPlans = () => {
    const allPlans = plans.length > 0 ? plans : defaultPlans;
    
    if (isAnnual) {
      // Quando anual, mostrar Básico, Profissional e Enterprise Anual
      return allPlans.filter(plan => plan.id === 'basic' || plan.id === 'pro' || plan.id === 'enterprise-annual');
    } else {
      // Quando mensal, mostrar Básico, Profissional e Enterprise mensal
      return allPlans.filter(plan => plan.id === 'basic' || plan.id === 'pro' || plan.id === 'enterprise');
    }
  };

  const displayPlans = getDisplayPlans();

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Escolha seu Plano
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
          Encontre o plano perfeito para suas necessidades. Todos os planos incluem 
          atualizações gratuitas e suporte técnico.
        </p>
        
        {/* Toggle Mensal/Anual */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-blue-600' : 'text-gray-500'}`}>
            Mensal
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-16 h-8 rounded-full transition-all duration-200 ${
              isAnnual ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-200 ${
                isAnnual ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
          </Button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-blue-600' : 'text-gray-500'}`}>
            Anual
          </span>
        </div>
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={currentPlan === plan.id}
            onSelect={() => onSelectPlan(plan)}
            loading={loading}
          />
        ))}
      </div>

      {/* Informações adicionais */}
      <div className="mt-12 text-center">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Todos os planos incluem:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Atualizações gratuitas</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Suporte técnico</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Backup automático</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>SSL/HTTPS</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>99.9% uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancelamento a qualquer momento</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Precisa de um plano personalizado?{' '}
          <a href="mailto:contato@financeflow.com" className="text-blue-600 hover:underline">
            Entre em contato conosco
          </a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans; 
