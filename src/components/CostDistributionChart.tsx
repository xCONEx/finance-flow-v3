
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAppContext } from '../contexts/AppContext';

const CostDistributionChart = () => {
  const { monthlyCosts } = useAppContext();

  // Group costs by category
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
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostDistributionChart;
