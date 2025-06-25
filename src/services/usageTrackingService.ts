
import { supabase } from '@/integrations/supabase/client';

export interface UsageRecord {
  id: string;
  user_id: string;
  usage_type: 'job' | 'project';
  count: number;
  reset_date: string;
  created_at: string;
  updated_at: string;
}

// For now, provide mock implementations since user_usage_tracking table doesn't exist
export const usageTrackingService = {
  async getUserUsage(userId: string, usageType: 'job' | 'project'): Promise<number> {
    console.log(`Mock: Getting usage for ${userId}, type: ${usageType}`);
    return 0; // Return 0 to allow unlimited usage for now
  },

  async incrementUsage(userId: string, usageType: 'job' | 'project'): Promise<void> {
    console.log(`Mock: Incrementing usage for ${userId}, type: ${usageType}`);
    // Mock implementation - do nothing for now
  },

  async resetUsageForUser(userId: string): Promise<void> {
    console.log(`Mock: Resetting usage for ${userId}`);
    // Mock implementation - do nothing for now
  },

  async getAllUsageForUser(userId: string): Promise<{ jobs: number; projects: number }> {
    console.log(`Mock: Getting all usage for ${userId}`);
    return { jobs: 0, projects: 0 }; // Return 0 to allow unlimited usage for now
  }
};

// Export additional functions that the hook expects
export const checkUserUsageLimit = async (userId: string, usageType: 'jobs' | 'projects'): Promise<boolean> => {
  console.log(`Mock: Checking usage limit for ${userId}, type: ${usageType}`);
  return true; // Always allow for now
};

export const incrementUserUsage = async (userId: string, usageType: 'jobs' | 'projects'): Promise<void> => {
  console.log(`Mock: Incrementing user usage for ${userId}, type: ${usageType}`);
  // Mock implementation - do nothing for now
};

export const resetUserUsageCounters = async (userId: string): Promise<void> => {
  console.log(`Mock: Resetting user usage counters for ${userId}`);
  // Mock implementation - do nothing for now
};

export const getUserUsageStats = async (userId: string) => {
  console.log(`Mock: Getting usage stats for ${userId}`);
  return { jobs: 0, projects: 0 }; // Return 0 to allow unlimited usage for now
};
