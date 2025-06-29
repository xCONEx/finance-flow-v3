
import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Client } from '@/types/client';
import { AddClientModal } from './AddClientModal';
import { useClients } from '@/hooks/useClients';

interface ClientSelectorProps {
  onClientSelect: (client: Client) => void;
  placeholder?: string;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onClientSelect, placeholder = "Buscar cliente..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { clients, loading, loadClients } = useClients();

  useEffect(() => {
    if (searchTerm) {
      console.log('Filtering clients with search term:', searchTerm);
      console.log('Available clients:', clients);
      
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      console.log('Filtered clients:', filtered);
      setFilteredClients(filtered);
      setShowDropdown(true);
    } else {
      setFilteredClients([]);
      setShowDropdown(false);
    }
  }, [searchTerm, clients]);

  const handleClientSelect = (client: Client) => {
    console.log('Client selected:', client);
    onClientSelect(client);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleAddSuccess = () => {
    loadClients();
    setShowAddModal(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          
          {showDropdown && filteredClients.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {client.name}
                    </div>
                    {client.email && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {client.email}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showDropdown && searchTerm && filteredClients.length === 0 && !loading && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 px-4 py-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum cliente encontrado
              </div>
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default ClientSelector;
