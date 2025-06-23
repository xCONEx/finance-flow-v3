import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, User, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Client } from '@/types/client';

interface ClientSelectorProps {
  selectedClient?: Client | null;
  onSelectClient: (client: Client | null) => void;
  onCreateNew: () => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClient,
  onSelectClient,
  onCreateNew
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { user } = useSupabaseAuth();

  const loadClients = async () => {
    if (!user || searchTerm.length < 2) {
      setClients([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setClients(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadClients();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, user]);

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    setSearchTerm(client.name);
    setShowResults(false);
  };

  const handleClearSelection = () => {
    onSelectClient(null);
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar cliente existente..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value) {
                  handleClearSelection();
                }
              }}
              className="pl-10"
              onFocus={() => {
                if (clients.length > 0) setShowResults(true);
              }}
            />
          </div>
          
          {selectedClient && (
            <Badge variant="outline" className="mt-2">
              <User className="w-3 h-3 mr-1" />
              Cliente selecionado: {selectedClient.name}
            </Badge>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCreateNew}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Cliente</span>
        </Button>
      </div>

      {/* Resultados da busca */}
      {showResults && clients.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {clients.map((client) => (
              <div
                key={client.id}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSelectClient(client)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{client.name}</div>
                    <div className="text-xs text-gray-500 space-y-1 mt-1">
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overlay para fechar resultados */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};
