import React from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Building2, Crown, Users } from 'lucide-react';

interface ContextIndicatorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const ContextIndicator: React.FC<ContextIndicatorProps> = ({ 
  variant = 'compact',
  className = ''
}) => {
  const { currentContext, agencies } = useAgency();

  const getCurrentContextInfo = () => {
    if (currentContext === 'individual') {
      return {
        name: 'Conta Individual',
        description: 'Seus projetos pessoais',
        icon: <User className="h-4 w-4" />,
        badge: null,
        color: 'bg-blue-100 text-blue-600'
      };
    }

    const agency = agencies.find(a => a.id === currentContext?.id);
    if (!agency) {
      return {
        name: 'Conta Individual',
        description: 'Seus projetos pessoais',
        icon: <User className="h-4 w-4" />,
        badge: null,
        color: 'bg-blue-100 text-blue-600'
      };
    }

    return {
      name: agency.name,
      description: agency.is_owner ? 'Proprietário' : agency.user_role,
      icon: agency.is_owner ? <Crown className="h-4 w-4" /> : <Users className="h-4 w-4" />,
      badge: agency.is_owner ? 'Owner' : agency.user_role,
      color: agency.is_owner ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
    };
  };

  const contextInfo = getCurrentContextInfo();

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className="h-6 w-6">
          <AvatarFallback className={contextInfo.color}>
            {contextInfo.icon}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {contextInfo.name}
          </span>
          {contextInfo.badge && (
            <Badge variant="outline" className="text-xs">
              {contextInfo.badge}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
      <Avatar className="h-10 w-10">
        <AvatarFallback className={contextInfo.color}>
          {contextInfo.icon}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">
            {contextInfo.name}
          </span>
          {contextInfo.badge && (
            <Badge variant="outline" className="text-xs">
              {contextInfo.badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">
          {contextInfo.description}
        </p>
      </div>
    </div>
  );
};

export default ContextIndicator; 