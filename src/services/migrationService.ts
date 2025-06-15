
import { supabase } from '@/integrations/supabase/client';
import { firestoreService } from './firestore';
import type { Tables } from '@/integrations/supabase/types';

interface MigrationProgress {
  step: string;
  current: number;
  total: number;
  completed: boolean;
  error?: string;
}

type ProgressCallback = (progress: MigrationProgress) => void;

export const migrationService = {
  async migrateUserData(firebaseUid: string, supabaseUserId: string, onProgress?: ProgressCallback) {
    console.log('🔄 Starting migration for user:', firebaseUid, '->', supabaseUserId);
    
    try {
      // 1. Migrar dados do usuário
      onProgress?.({
        step: 'Migrando perfil do usuário',
        current: 1,
        total: 5,
        completed: false
      });

      const userData = await firestoreService.getUserData(firebaseUid);
      if (userData) {
        await this.migrateProfile(userData, supabaseUserId);
      }

      // 2. Migrar equipamentos
      onProgress?.({
        step: 'Migrando equipamentos',
        current: 2,
        total: 5,
        completed: false
      });

      if (userData?.equipments) {
        await this.migrateEquipments(userData.equipments, supabaseUserId);
      }

      // 3. Migrar despesas
      onProgress?.({
        step: 'Migrando despesas',
        current: 3,
        total: 5,
        completed: false
      });

      if (userData?.expenses) {
        await this.migrateExpenses(userData.expenses, supabaseUserId);
      }

      // 4. Migrar jobs
      onProgress?.({
        step: 'Migrando trabalhos',
        current: 4,
        total: 5,
        completed: false
      });

      if (userData?.jobs) {
        await this.migrateJobs(userData.jobs, supabaseUserId);
      }

      // 5. Migrar rotina
      onProgress?.({
        step: 'Migrando rotina de trabalho',
        current: 5,
        total: 5,
        completed: false
      });

      if (userData?.routine) {
        await this.migrateWorkRoutine(userData.routine, supabaseUserId);
      }

      onProgress?.({
        step: 'Migração concluída',
        current: 5,
        total: 5,
        completed: true
      });

      console.log('✅ Migration completed for user:', firebaseUid);
      return { success: true };

    } catch (error) {
      console.error('❌ Migration error:', error);
      onProgress?.({
        step: 'Erro na migração',
        current: 0,
        total: 5,
        completed: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return { success: false, error };
    }
  },

  async migrateProfile(userData: any, supabaseUserId: string) {
    const profileData = {
      id: supabaseUserId,
      email: userData.email || '',
      name: userData.name || null,
      phone: userData.phone || null,
      company: userData.company || null,
      logo_base64: userData.logobase64 || null,
      user_type: this.mapUserType(userData.role || userData.userType) as 'individual' | 'company_owner' | 'employee' | 'admin',
      subscription: 'free' as const,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(profileData);

    if (error) {
      console.error('Error migrating profile:', error);
      throw error;
    }
  },

  async migrateEquipments(equipments: any[], supabaseUserId: string) {
    for (const equipment of equipments) {
      const equipmentData = {
        user_id: supabaseUserId,
        description: equipment.description || equipment.name || 'Equipamento',
        category: equipment.category || 'Outros',
        value: parseFloat(equipment.value || equipment.price || '0'),
        depreciation_years: equipment.depreciationYears || 5,
      };

      const { error } = await supabase
        .from('equipment')
        .insert(equipmentData);

      if (error) {
        console.error('Error migrating equipment:', error);
        throw error;
      }
    }
  },

  async migrateExpenses(expenses: any[], supabaseUserId: string) {
    for (const expense of expenses) {
      const expenseData = {
        user_id: supabaseUserId,
        description: expense.description || expense.name || 'Despesa',
        category: expense.category || 'Outros',
        value: parseFloat(expense.value || expense.amount || '0'),
        month: expense.month || new Date().toISOString().substring(0, 7), // YYYY-MM
      };

      const { error } = await supabase
        .from('expenses')
        .insert(expenseData);

      if (error) {
        console.error('Error migrating expense:', error);
        throw error;
      }
    }
  },

  async migrateJobs(jobs: any[], supabaseUserId: string) {
    for (const job of jobs) {
      const jobData = {
        user_id: supabaseUserId,
        description: job.description || job.name || 'Trabalho',
        client: job.client || job.clientName || 'Cliente',
        event_date: job.eventDate ? new Date(job.eventDate).toISOString() : null,
        estimated_hours: parseInt(job.estimatedHours || job.hours || '0'),
        difficulty_level: this.mapDifficultyLevel(job.difficultyLevel) as 'fácil' | 'médio' | 'complicado' | 'difícil',
        logistics: parseFloat(job.logistics || '0'),
        equipment: parseFloat(job.equipment || '0'),
        assistance: parseFloat(job.assistance || '0'),
        status: (job.status === 'approved' ? 'aprovado' : 'pendente') as 'pendente' | 'aprovado',
        category: job.category || null,
        discount_value: parseFloat(job.discountValue || '0'),
        total_costs: parseFloat(job.totalCosts || '0'),
        service_value: parseFloat(job.serviceValue || '0'),
        value_with_discount: parseFloat(job.valueWithDiscount || '0'),
        profit_margin: parseFloat(job.profitMargin || '30'),
      };

      const { error } = await supabase
        .from('jobs')
        .insert(jobData);

      if (error) {
        console.error('Error migrating job:', error);
        throw error;
      }
    }
  },

  async migrateWorkRoutine(routine: any, supabaseUserId: string) {
    const routineData = {
      user_id: supabaseUserId,
      desired_salary: parseFloat(routine.desiredSalary || '0'),
      work_days_per_month: parseInt(routine.workDays || routine.daysPerMonth || '22'),
      work_hours_per_day: parseInt(routine.dailyHours || routine.hoursPerDay || '8'),
      value_per_day: parseFloat(routine.dailyValue || routine.valuePerDay || '0'),
      value_per_hour: parseFloat(routine.hourlyValue || routine.valuePerHour || '0'),
    };

    const { error } = await supabase
      .from('work_routine')
      .upsert(routineData);

    if (error) {
      console.error('Error migrating work routine:', error);
      throw error;
    }
  },

  mapUserType(firebaseUserType: string): 'individual' | 'company_owner' | 'employee' | 'admin' {
    switch (firebaseUserType) {
      case 'admin':
        return 'admin';
      case 'company_owner':
      case 'owner':
        return 'company_owner';
      case 'employee':
      case 'editor':
      case 'viewer':
        return 'employee';
      default:
        return 'individual';
    }
  },

  mapDifficultyLevel(firebaseDifficulty: string): 'fácil' | 'médio' | 'complicado' | 'difícil' {
    switch (firebaseDifficulty) {
      case 'easy':
      case 'fácil':
        return 'fácil';
      case 'medium':
      case 'médio':
        return 'médio';
      case 'complicated':
      case 'complicado':
        return 'complicado';
      case 'hard':
      case 'difícil':
        return 'difícil';
      default:
        return 'médio';
    }
  },

  async checkMigrationStatus(supabaseUserId: string) {
    try {
      // Verificar se o usuário já tem dados migrados
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUserId)
        .single();

      const { data: equipment } = await supabase
        .from('equipment')
        .select('id')
        .eq('user_id', supabaseUserId)
        .limit(1);

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', supabaseUserId)
        .limit(1);

      return {
        hasProfile: !!profile,
        hasEquipment: equipment && equipment.length > 0,
        hasJobs: jobs && jobs.length > 0,
        isMigrated: !!profile && (equipment?.length > 0 || jobs?.length > 0)
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        hasProfile: false,
        hasEquipment: false,
        hasJobs: false,
        isMigrated: false
      };
    }
  }
};
