
// Mock usage tracking service since user_usage_tracking table doesn't exist
export interface UsageData {
  userId: string;
  action: string;
  feature: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class UsageTrackingService {
  private usageData: UsageData[] = [];

  async trackUsage(userId: string, action: string, feature: string, metadata?: Record<string, any>): Promise<void> {
    const usage: UsageData = {
      userId,
      action,
      feature,
      timestamp: new Date(),
      metadata
    };

    // Store in memory for now
    this.usageData.push(usage);
    
    // Log for debugging
    console.log('Usage tracked:', usage);
  }

  async getUserUsage(userId: string, startDate?: Date, endDate?: Date): Promise<UsageData[]> {
    let filtered = this.usageData.filter(data => data.userId === userId);
    
    if (startDate) {
      filtered = filtered.filter(data => data.timestamp >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(data => data.timestamp <= endDate);
    }
    
    return filtered;
  }

  async getUsageStats(userId: string): Promise<{ totalActions: number; features: string[] }> {
    const userUsage = await this.getUserUsage(userId);
    const features = [...new Set(userUsage.map(u => u.feature))];
    
    return {
      totalActions: userUsage.length,
      features
    };
  }

  async checkFeatureLimit(userId: string, feature: string, limit: number): Promise<{ canUse: boolean; usage: number }> {
    const userUsage = await this.getUserUsage(userId);
    const featureUsage = userUsage.filter(u => u.feature === feature);
    
    return {
      canUse: featureUsage.length < limit,
      usage: featureUsage.length
    };
  }

  clearUsageData(): void {
    this.usageData = [];
  }
}

export const usageTrackingService = new UsageTrackingService();
export default usageTrackingService;
