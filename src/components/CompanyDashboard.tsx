import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Building2,
  Crown,
  Shield,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  UserPlus,
  Search,
  Settings,
  Video,
  FileVideo
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

const CompanyDashboard = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useSupabaseAuth();
  
  // Simplified version without agency features for now
  // Since we don't have agency tables in current Supabase schema
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestão de Equipe
              </h1>
              <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <Video className="h-16 w-16 mx-auto text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gestão de Equipe Audiovisual
            </h3>
            <p className="text-gray-600 mb-4">
              Esta funcionalidade está sendo migrada para o novo sistema. Em breve você poderá gerenciar sua equipe e colaboradores.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <FileVideo className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-sm text-purple-700">
                Por enquanto, você tem acesso completo ao Kanban de Projetos para gerenciar seus trabalhos de filmagem e edição.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDashboard;
