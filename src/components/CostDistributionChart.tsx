
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { usePrivacy } from '../contexts/PrivacyContext';

const CostDistributionChart = () => {
  const { monthlyCosts } = useApp();
  const { formatValue } = usePrivacy();

  // CRITICAL FIX: Force safe array initialization with comprehensive safety checks
  const safeMonthlyCosts = React.useMemo(() => {
    console.log('CostDistributionChart - monthlyCosts debug:', { 
      monthlyCosts: monthlyCosts ? 'defined' : 'undefined',
      type: typeof monthlyCosts,
      isArray: Array.isArray(monthlyCosts),
      length: Array.isArray(monthlyCosts) ? monthlyCosts.length : 'N/A'
    });
    
    if (!monthlyCosts || !Array.isArray(monthlyCosts)) {
      console.log('CostDistributionChart - Returning empty array due to invalid monthlyCosts');
      return [];
    }
    return monthlyCosts;
  }, [monthlyCosts]);

  // Filter out financial transactions and reserve items - only show regular monthly costs
  const regularMonthlyCosts = React.useMemo(() => {
    if (!Array.isArray(safeMonthlyCosts)) {
      console.log('CostDistributionChart - safeMonthlyCosts is not array, returning empty');
      return [];
    }
    
    return safeMonthlyCosts.filter(cost => {
      // Add null/undefined safety checks for cost object
      if (!cost || typeof cost !== 'object') {
        console.log('CostDistributionChart - Invalid cost object:', cost);
        return false;
      }
      
      const description = cost.description || '';
      const category = cost.category || '';
      
      return !description.includes('FINANCIAL_INCOME:') && 
        !description.includes('FINANCIAL_EXPENSE:') &&
        !description.includes('RESERVE_') &&
        !description.includes('Reserva:') &&
        !description.includes('SMART_RESERVE') &&
        category !== 'Reserva' &&
        category !== 'Smart Reserve' &&
        category !== 'Reserve' &&
        !cost.companyId; // Only personal costs
    });
  }, [safeMonthlyCosts]);

  const costsByCategory = React.useMemo(() => {
    if (!Array.isArray(regularMonthlyCosts)) {
      console.log('CostDistributionChart - regularMonthlyCosts is not array');
      return {};
    }
    
    return regularMonthlyCosts.reduce((acc, cost) => {
      // Add safety checks for cost object
      if (!cost || typeof cost !== 'object') {
        console.log('CostDistributionChart - Invalid cost in reduce:', cost);
        return acc;
      }
      
      const category = cost.category || 'Outros';
      const value = cost.value || 0;
      const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
      
      acc[category] = (acc[category] || 0) + safeValue;
      return acc;
    }, {} as Record<string, number>);
  }, [regularMonthlyCosts]);

  const data = React.useMemo(() => {
    return Object.entries(costsByCategory)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value
      }));
  }, [costsByCategory]);

  const COLORS = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7c7c',
    '#8dd1e1',
    '#d084d0',
    '#ffb347'
  ];

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>Nenhum custo mensal cadastrado ainda</p>
      </div>
    );
  }

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-blue-600">{formatValue(value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 flex flex-col items-center justify-center w-full">
      {/* Gráfico centralizado responsivo */}
      <div className="w-full flex justify-center">
        <div className="w-64 sm:w-80 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legenda responsiva */}
      <div className="w-full max-w-xs sm:max-w-sm space-y-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>{entry.name}</span>
            </div>
            <span className="font-semibold whitespace-nowrap">
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostDistributionChart;
