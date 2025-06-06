
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Building2, Users, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // Simular dados de assinatura atual (substituir por dados reais do Stripe)
  const currentPlan = 'free'; // free, premium, enterprise

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 'R$ 0',
      period: '/mês',
      description: 'Para começar a organizar suas finanças',
      icon: Zap,
      color: 'from-gray-600 to-gray-700',
      borderColor: 'border-gray-200',
      features: [
        'Calculadora de precificação',
        'Controle de custos mensais',
        'Gestão de equipamentos',
        'Relatórios básicos',
        'Suporte por email'
      ],
      limitations: [
        'Máximo 10 jobs por mês',
        'Sem backup em nuvem',
        'Sem recursos de equipe'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'R$ 97',
      period: '/mês',
      description: 'Para profissionais que querem mais controle',
      icon: Crown,
      color: 'from-purple-600 to-blue-600',
      borderColor: 'border-purple-200',
      popular: true,
      features: [
        'Tudo do plano Free',
        'Jobs ilimitados',
        'Relatórios avançados com gráficos',
        'Geração de PDF com logo personalizável',
        'Backup automático em nuvem',
        'Suporte prioritário',
        'Templates personalizados',
        'Importação de planilhas'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'R$ 197',
      period: '/mês',
      description: 'Para empresas e equipes',
      icon: Building2,
      color: 'from-green-600 to-blue-600',
      borderColor: 'border-green-200',
      features: [
        'Tudo do plano Premium',
        'Gestão de equipe completa',
        'Kanban de projetos',
        'Convites para colaboradores',
        'Painéis por empresa',
        'Exportação de dados avançada',
        'API para integrações',
        'Suporte dedicado',
        'Treinamento da equipe'
      ]
    }
  ];

  const handleSubscribe = async (planId: string) => {
    setIsLoading(planId);
    
    try {
      // Aqui será implementada a integração com Stripe
      console.log('Iniciando checkout para o plano:', planId);
      
      // Simular processo de checkout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirecionar para Stripe Checkout ou abrir modal de pagamento
      alert(`Redirecionando para checkout do plano ${planId}`);
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Crown className={`text-${currentTheme.accent}`} />
          Planos e Assinatura
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o plano ideal para suas necessidades
        </p>
      </div>

      {/* Mostrar plano atual se não for free */}
      {currentPlan !== 'free' && (
        <Card className={`bg-gradient-to-r ${currentTheme.secondary} border-${currentTheme.accent}/20`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Plano Atual</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Você está no plano {plans.find(p => p.id === currentPlan)?.name}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className={`bg-${currentTheme.accent} text-white`}>Ativo</Badge>
                <Button variant="outline" size="sm">
                  Gerenciar Assinatura
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative ${plan.popular ? `border-2 ${plan.borderColor} ring-2 ring-purple-100` : 'border border-gray-200 dark:border-gray-700'} hover:shadow-lg transition-all duration-300`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className={`bg-gradient-to-r ${plan.color} text-white px-4 py-1`}>
                  Mais Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <plan.icon className="h-8 w-8 text-white" />
              </div>
              
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="space-y-1">
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="h-5 w-5 mt-0.5 flex-shrink-0 flex items-center justify-center">
                          <div className="h-2 w-2 bg-gray-400 rounded-full" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                className={`w-full ${
                  currentPlan === plan.id 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : plan.popular 
                      ? `bg-gradient-to-r ${plan.color} hover:opacity-90` 
                      : ''
                }`}
                disabled={currentPlan === plan.id || isLoading === plan.id}
                onClick={() => handleSubscribe(plan.id)}
              >
                {isLoading === plan.id ? (
                  'Processando...'
                ) : currentPlan === plan.id ? (
                  'Plano Atual'
                ) : plan.id === 'free' ? (
                  'Plano Gratuito'
                ) : (
                  `Assinar ${plan.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-4">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">Precisa de algo personalizado?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Entre em contato conosco para planos customizados para sua empresa
          </p>
          <Button variant="outline">
            Falar com Vendas
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Todos os planos incluem 14 dias de teste gratuito</p>
          <p>• Cancele a qualquer momento</p>
          <p>• Suporte em português</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
