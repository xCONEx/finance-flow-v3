import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Client } from '@/types/client';

interface ClientSelectorProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ selectedClient, onClientSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchClients();
    } else {
      setClients([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const searchClients = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      setClients(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleRemoveClient = () => {
    onClientSelect(null);
  };

  if (selectedClient) {
    return (
      <div className="space-y-2">
        <Label>Cliente Selecionado</Label>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{selectedClient.name}</p>
                  {selectedClient.email && (
                    <p className="text-sm text-blue-700">{selectedClient.email}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveClient}
                className="h-6 w-6 p-0 text-blue-600 hover:text-red-600 hover:bg-red-50"
                title="Remover cliente"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="client-search">Buscar Cliente (opcional)</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          id="client-search"
          type="text"
          placeholder="Digite o nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showResults && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white border shadow-lg">
          <CardContent className="p-2">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Buscando...</div>
            ) : clients.length > 0 ? (
              <div className="space-y-1">
                {clients.map((client) => (
                  <Button
                    key={client.id}
                    variant="ghost"
                    className="w-full p-3 h-auto justify-start hover:bg-blue-50"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">{client.name}</div>
                        {client.email && (
                          <div className="text-sm text-gray-500">{client.email}</div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Nenhum cliente encontrado
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientSelector;
