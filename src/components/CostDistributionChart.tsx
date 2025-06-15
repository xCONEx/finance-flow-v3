
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { usePrivacy } from '../contexts/PrivacyContext';

const CostDistributionChart = () => {
  const { monthlyCosts } = useApp();
  const { formatValue } = usePrivacy();

  const costsByCategory = monthlyCosts.reduce((acc, cost) => {
    const category = cost.category || 'Outros';
    acc[category] = (acc[category] || 0) + cost.value;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(costsByCategory).map(([name, value]) => ({
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
        <p>Nenhum custo cadastrado ainda</p>
      </div>
    );
  }

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
              <Tooltip formatter={(value: number) => formatValue(value)} />
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
