
import React, { useState } from 'react';
import { Users, Plus, Mail, Shield, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

const TeamManagement = () => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: '',
    permissions: []
  });

  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: 'João Silva',
      email: 'joao@financeflow.com',
      role: 'Administrador',
      permissions: ['Todos os acessos'],
      avatar: 'JS',
      status: 'Ativo'
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria@empresa.com',
      role: 'Editor',
      permissions: ['Visualizar Jobs', 'Editar Projetos'],
      avatar: 'MS',
      status: 'Ativo'
    },
    {
      id: 3,
      name: 'Carlos Lima',
      email: 'carlos@empresa.com',
      role: 'Cinegrafista',
      permissions: ['Visualizar Escalas', 'Visualizar Jobs'],
      avatar: 'CL',
      status: 'Ativo'
    },
    {
      id: 4,
      name: 'Ana Costa',
      email: 'ana@empresa.com',
      role: 'Designer',
      permissions: ['Visualizar Jobs', 'Criar Escalas'],
      avatar: 'AC',
      status: 'Pendente'
    }
  ]);

  const roles = [
    'Administrador',
    'Líder de Projeto',
    'Editor',
    'Cinegrafista',
    'Designer',
    'Freelancer'
  ];

  const availablePermissions = [
    'Visualizar Jobs',
    'Criar Jobs',
    'Editar Jobs',
    'Visualizar Valores',
    'Criar Escalas',
    'Editar Escalas',
    'Gerenciar Equipe',
    'Configurações'
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrador': return 'bg-red-100 text-red-800';
      case 'Líder de Projeto': return 'bg-blue-100 text-blue-800';
      case 'Editor': return 'bg-purple-100 text-purple-800';
      case 'Cinegrafista': return 'bg-green-100 text-green-800';
      case 'Designer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    return status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const member = {
      id: teamMembers.length + 1,
      ...newMember,
      avatar: newMember.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      status: 'Pendente'
    };

    setTeamMembers([...teamMembers, member]);
    setNewMember({ name: '', email: '', role: '', permissions: [] });
    setIsAddingMember(false);

    toast({
      title: "Membro Adicionado!",
      description: `Convite enviado para ${newMember.email}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="text-purple-600" />
            Gestão de Equipe
          </h2>
          <p className="text-gray-600">Gerencie colaboradores e permissões</p>
        </div>

        <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Membro da Equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  placeholder="joao@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função *</Label>
                <Select value={newMember.role} onValueChange={(value) => setNewMember({...newMember, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddingMember(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleAddMember} className="flex-1">
                  Enviar Convite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Membros', value: teamMembers.length, color: 'text-blue-600' },
          { label: 'Membros Ativos', value: teamMembers.filter(m => m.status === 'Ativo').length, color: 'text-green-600' },
          { label: 'Convites Pendentes', value: teamMembers.filter(m => m.status === 'Pendente').length, color: 'text-yellow-600' },
          { label: 'Administradores', value: teamMembers.filter(m => m.role === 'Administrador').length, color: 'text-purple-600' }
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{member.name}</h4>
                      <Badge className={getRoleColor(member.role)} variant="secondary">
                        {member.role}
                      </Badge>
                      <Badge className={getStatusColor(member.status)} variant="secondary">
                        {member.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span>{member.email}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Shield className="h-3 w-3 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {member.permissions.slice(0, 2).map((permission, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {member.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.permissions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;
