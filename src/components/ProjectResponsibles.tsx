import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabaseKanbanService, ProjectResponsible } from '@/services/supabaseKanbanService';

interface ProjectResponsiblesProps {
  projectId: string;
  responsaveis: string[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

const ProjectResponsibles: React.FC<ProjectResponsiblesProps> = ({
  projectId,
  responsaveis,
  maxVisible = 3,
  size = 'sm'
}) => {
  const [responsibleData, setResponsibleData] = useState<ProjectResponsible[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados dos responsáveis
  useEffect(() => {
    if (projectId && responsaveis.length > 0) {
      loadResponsibleData();
    }
  }, [projectId, responsaveis]);

  const loadResponsibleData = async () => {
    try {
      setLoading(true);
      const data = await supabaseKanbanService.getProjectResponsibles(projectId);
      setResponsibleData(data);
    } catch (error) {
      console.error('Erro ao carregar dados dos responsáveis:', error);
    } finally {
      setLoading(false);
    }
  };

  // Definir tamanhos dos avatares
  const getAvatarSize = () => {
    switch (size) {
      case 'sm': return 'h-6 w-6';
      case 'md': return 'h-8 w-8';
      case 'lg': return 'h-10 w-10';
      default: return 'h-6 w-6';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'md': return 'text-sm';
      case 'lg': return 'text-base';
      default: return 'text-xs';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <div className={`${getAvatarSize()} bg-gray-200 rounded-full animate-pulse`} />
      </div>
    );
  }

  if (responsibleData.length === 0) {
    return null;
  }

  const visibleResponsibles = responsibleData.slice(0, maxVisible);
  const hiddenCount = responsibleData.length - maxVisible;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {visibleResponsibles.map((responsible, index) => (
          <Tooltip key={responsible.user_id}>
            <TooltipTrigger asChild>
              <Avatar 
                className={`${getAvatarSize()} border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer`}
                style={{ zIndex: visibleResponsibles.length - index }}
              >
                <AvatarImage src={responsible.avatar_url} />
                <AvatarFallback className={`${getTextSize()} bg-gradient-to-br from-blue-500 to-purple-600 text-white`}>
                  {responsible.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">{responsible.name}</p>
                <p className="text-xs text-muted-foreground">{responsible.email}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${getAvatarSize()} bg-gray-100 border-2 border-white rounded-full flex items-center justify-center ${getTextSize()} font-medium text-gray-600 shadow-sm`}>
                +{hiddenCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">Mais {hiddenCount} responsável{hiddenCount > 1 ? 'is' : ''}</p>
                <div className="mt-2 space-y-1">
                  {responsibleData.slice(maxVisible).map(responsible => (
                    <div key={responsible.user_id} className="flex items-center gap-2">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={responsible.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {responsible.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{responsible.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ProjectResponsibles; 