
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { usePrivacy } from '../contexts/PrivacyContext';

const CostDistributionChart = () => {
  const { monthlyCosts } = useApp();
  const { formatValue } = usePrivacy();

  // Ensure monthlyCosts is always an array
  const safeMonthlyCosts = monthlyCosts || [];

  // Filter out financial transactions and reserve items - only show regular monthly costs
  const regularMonthlyCosts = safeMonthlyCosts.filter(cost => 
    !cost.description?.includes('FINANCIAL_INCOME:') && 
    !cost.description?.includes('FINANCIAL_EXPENSE:') &&
    !cost.description?.includes('RESERVE_') &&
    !cost.description?.includes('Reserva:') &&
    !cost.description?.includes('SMART_RESERVE') &&
    cost.category !== 'Reserva' &&
    cost.category !== 'Smart Reserve' &&
    cost.category !== 'Reserve' &&
    !cost.companyId // Only personal costs
  );

  const costsByCategory = regularMonthlyCosts.reduce((acc, cost) => {
    const category = cost.category || 'Outros';
    // Usar verificação segura para o valor
    const value = cost.value || 0;
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    
    acc[category] = (acc[category] || 0) + safeValue;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(costsByCategory)
    .filter(([_, value]) => value > 0) // Filtrar valores zero ou negativos
    .map(([name, value]) => ({
      name,
      value
    }));

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
