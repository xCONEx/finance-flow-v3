import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabaseKanbanService, AgencyCollaborator } from '@/services/supabaseKanbanService';
import { useToast } from '@/hooks/use-toast';

interface ResponsibleSelectorProps {
  agencyId: string;
  selectedResponsibles: string[];
  onResponsiblesChange: (responsibles: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ResponsibleSelector: React.FC<ResponsibleSelectorProps> = ({
  agencyId,
  selectedResponsibles,
  onResponsiblesChange,
  disabled = false,
  placeholder = "Selecionar responsáveis..."
}) => {
  const [open, setOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<AgencyCollaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { toast } = useToast();

  // Carregar colaboradores da agência
  useEffect(() => {
    if (agencyId) {
      loadCollaborators();
    }
  }, [agencyId]);

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const data = await supabaseKanbanService.getAgencyCollaborators(agencyId);
      setCollaborators(data);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar colaboradores da agência",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar colaboradores baseado na busca
  const filteredCollaborators = collaborators.filter(collaborator =>
    collaborator.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    collaborator.email.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Adicionar responsável
  const addResponsible = (userId: string) => {
    if (!selectedResponsibles.includes(userId)) {
      onResponsiblesChange([...selectedResponsibles, userId]);
    }
    setSearchValue('');
  };

  // Remover responsável
  const removeResponsible = (userId: string) => {
    onResponsiblesChange(selectedResponsibles.filter(id => id !== userId));
  };

  // Obter dados do responsável selecionado
  const getSelectedResponsible = (userId: string) => {
    return collaborators.find(c => c.user_id === userId);
  };

  return (
    <div className="space-y-3">
      {/* Responsáveis selecionados */}
      {selectedResponsibles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedResponsibles.map(userId => {
            const responsible = getSelectedResponsible(userId);
            return (
              <Badge
                key={userId}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800"
              >
                <Avatar className="h-4 w-4">
                  <AvatarImage src={responsible?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {responsible?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{responsible?.name || 'Usuário'}</span>
                <Button
                  className="h-4 w-4 p-0 hover:bg-transparent bg-transparent"
                  onClick={() => removeResponsible(userId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Seletor de responsáveis */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            className="w-full justify-between border border-gray-300 bg-white hover:bg-gray-50"
            disabled={disabled || loading}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {loading ? 'Carregando...' : placeholder}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar colaboradores..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Carregando colaboradores...' : 'Nenhum colaborador encontrado.'}
              </CommandEmpty>
              <CommandGroup>
                {filteredCollaborators.map((collaborator) => {
                  const isSelected = selectedResponsibles.includes(collaborator.user_id);
                  return (
                    <CommandItem
                      key={collaborator.user_id}
                      value={collaborator.user_id}
                      onSelect={() => addResponsible(collaborator.user_id)}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={collaborator.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {collaborator.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{collaborator.name}</span>
                        <span className="text-xs text-muted-foreground">{collaborator.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-blue-100 text-blue-800 border border-blue-200">
                          {collaborator.role}
                        </Badge>
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ResponsibleSelector; 