
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import { AddClientModal } from './AddClientModal';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  cnpj?: string;
}

interface ClientSelectorProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ 
  selectedClient, 
  onClientSelect 
}) => {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useSupabaseAuth();
  const { currentContext } = useAgency();
  const { toast } = useToast();

  const loadClients = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('id, name, phone, email, cnpj')
        .eq('user_id', user.id);

      if (currentContext !== 'individual' && currentContext.id) {
        query = query.eq('company_id', currentContext.id);
      } else {
        query = query.is('company_id', null);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar clientes.",
          variant: "destructive"
        });
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [user, currentContext]);

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setOpen(false);
  };

  const handleRemoveClient = () => {
    onClientSelect(null);
  };

  const handleAddSuccess = () => {
    loadClients();
    setShowAddModal(false);
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Cliente</Label>
        
        {selectedClient ? (
          <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
            <div className="flex-1">
              <div className="font-medium">{selectedClient.name}</div>
              {selectedClient.email && (
                <div className="text-sm text-gray-500">{selectedClient.email}</div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveClient}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                Selecionar cliente...
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar cliente..." />
                <CommandList>
                  <CommandEmpty>
                    <div className="p-2 text-center">
                      <p className="text-sm text-gray-500 mb-2">Nenhum cliente encontrado</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setOpen(false);
                          setShowAddModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Cliente
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar novo cliente</span>
                    </CommandItem>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        onSelect={() => handleClientSelect(client)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div>
                          <div className="font-medium">{client.name}</div>
                          {client.email && (
                            <div className="text-sm text-gray-500">{client.email}</div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </>
  );
};
