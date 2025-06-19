
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, PiggyBank, ArrowLeft } from 'lucide-react';
import FinancialOverview from './FinancialOverview';
import SmartReserve from './SmartReserve';
import PremiumFeatureBlock from '../PremiumFeatureBlock';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';

const FinancialManagement: React.FC = () => {
  const [activeView, setActiveView] = useState('overview');
  const { subscription } = useSubscriptionPermissions();
  
  const hasPremiumAccess = ['premium', 'enterprise', 'enterprise-annual'].includes(subscription);

  if (!hasPremiumAccess) {
    return (
      <PremiumFeatureBlock
        feature="Sistema Financeiro Completo"
        requiredPlan="premium"
        className="max-w-2xl mx-auto mt-8"
      >
        <div className="text-center p-8">
          <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Gestão Financeira</h3>
          <p className="text-gray-600">
            Controle completo das suas receitas, despesas e reserve inteligentemente para seus objetivos.
          </p>
        </div>
      </PremiumFeatureBlock>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gestão Financeira
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Controle suas receitas e despesas
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Gestão Financeira
          </TabsTrigger>
          <TabsTrigger value="reserve" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Reserva Inteligente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <FinancialOverview />
        </TabsContent>

        <TabsContent value="reserve" className="mt-6">
          <SmartReserve />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialManagement;
