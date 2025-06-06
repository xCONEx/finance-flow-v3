
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Rocket, ShoppingCart, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import InviteAcceptance from './InviteAcceptance';

const Dashboard = () => {
  const [totalRevenue, setTotalRevenue] = useState(5400.5);
  const [newSales, setNewSales] = useState(24);
  const [activeCustomers, setActiveCustomers] = useState(720);
  const [ordersThisMonth, setOrdersThisMonth] = useState(4556);
  const { valuesHidden } = usePrivacy();
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Convites pendentes só para usuários individuais */}
      {user?.userType === 'individual' && <InviteAcceptance />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {valuesHidden ? 'R$ ****' : `R$ ${totalRevenue.toFixed(2)}`}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <DollarSign className="h-4 w-4 inline-block mr-1" />
              Desde o início
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novas Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newSales}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <Rocket className="h-4 w-4 inline-block mr-1" />
              Este mês
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4 inline-block mr-1" />
              Clientes engajados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersThisMonth}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <ShoppingCart className="h-4 w-4 inline-block mr-1" />
              Pedidos realizados
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Aqui você tem uma visão geral do seu negócio. Acompanhe as
              métricas mais importantes e veja como sua empresa está performando.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
