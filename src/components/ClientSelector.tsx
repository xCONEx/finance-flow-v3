import React, { useState, useEffect } from 'react';
import { Search, X, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import ClientJobHistory from './clients/ClientJobHistory';
import { AddClientModal } from './clients/AddClientModal';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company_id?: string;
}

interface ClientSelectorProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ selectedClient, onClientSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { user } = useSupabaseAuth();
  const { currentContext } = useAgency();

  const fetchClients = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);

      if (currentContext !== 'individual' && currentContext.id) {
        query = query.eq('company_id', currentContext.id);
      } else {
        query = query.is('company_id', null);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user, currentContext]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredClients(filtered);
      setShowResults(true);
    } else {
      setFilteredClients([]);
      setShowResults(false);
    }
  }, [searchTerm, clients]);

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleRemoveClient = () => {
    onClientSelect(null);
  };

  return (
    <div className="space-y-4">
      {selectedClient ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <span className="font-medium text-blue-900">{selectedClient.name}</span>
                {selectedClient.email && (
                  <span className="text-sm text-blue-600 ml-2">({selectedClient.email})</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveClient}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full"
          >
            {showHistory ? 'Ocultar' : 'Ver'} Histórico de Trabalhos
          </Button>

          {showHistory && (
            <ClientJobHistory clientId={selectedClient.id} />
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar cliente existente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {showResults && (
            <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-3 text-center text-gray-500">Carregando...</div>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {client.email && (
                          <div className="text-sm text-gray-500">{client.email}</div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    Nenhum cliente encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-2">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Novo Cliente
            </Button>
          </div>
        </div>
      )}

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchClients();
        }}
      />
    </div>
  );
};

export default ClientSelector;
