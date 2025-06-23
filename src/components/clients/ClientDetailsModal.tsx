import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, FileText, Building2 } from 'lucide-react';
import { Client } from '@/types/client';
import { ClientJobHistory } from './ClientJobHistory';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  client 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl text-blue-600 flex items-center gap-2">
            <User className="w-5 h-5" />
            {client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">Nome</div>
                    <div className="text-sm text-gray-600 break-words">{client.name}</div>
                  </div>
                </div>

                {client.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-gray-600 break-words">{client.email}</div>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">Telefone</div>
                      <div className="text-sm text-gray-600">{client.phone}</div>
                    </div>
                  </div>
                )}

                {client.cnpj && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">CNPJ</div>
                      <Badge variant="outline" className="mt-1">{client.cnpj}</Badge>
                    </div>
                  </div>
                )}

                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">Endereço</div>
                      <div className="text-sm text-gray-600 break-words">{client.address}</div>
                    </div>
                  </div>
                )}

                {client.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">Descrição</div>
                      <div className="text-sm text-gray-600 break-words">{client.description}</div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    Cliente desde: {new Date(client.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Trabalhos */}
          <div className="lg:col-span-1">
            <ClientJobHistory client={client} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
