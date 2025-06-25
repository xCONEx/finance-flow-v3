
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile as UserProfileType } from '@/types';

const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfileType>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        toast({
          title: "Erro",
          description: "Erro ao buscar perfil. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.name && formData.name.trim() && user) {
      setLoading(true);
      try {
        const updatedProfile = {
          ...formData,
          company: formData.company || '',
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('profiles')
          .update(updatedProfile)
          .eq('id', user.id);

        if (error) {
          console.error('Erro ao atualizar perfil:', error);
          toast({
            title: "Erro",
            description: "Erro ao atualizar perfil. Tente novamente.",
            variant: "destructive",
          });
          return;
        }

        setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
        setIsEditing(false);
        
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso!",
        });
      } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar perfil. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <p>Carregando perfil...</p>;
  }

  if (!profile) {
    return <p>Perfil não encontrado.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Perfil</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              type="text"
              id="name"
              value={formData.name || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={formData.email}
              disabled
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              type="text"
              id="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              type="text"
              id="company"
              value={formData.company || ''}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>
          {!isEditing ? (
            <Button type="button" onClick={() => setIsEditing(true)}>
              Editar Perfil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
