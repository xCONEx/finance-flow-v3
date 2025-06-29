
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
  trend,
  onClick
}) => {
  return (
    <Card 
      className={`${bgColor} transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer border-0 shadow-md`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className={`text-2xl font-bold ${color} mb-1`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-sm font-medium ${color} opacity-75`}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500 ml-1">vs último mês</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${bgColor.replace('50', '100').replace('900/20', '900/30')}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
