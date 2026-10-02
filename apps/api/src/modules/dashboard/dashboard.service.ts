import { DashboardRepository } from './dashboard.repository';
import { redis, buildCacheKey } from '../../infrastructure/redis/redisClient';
import { DashboardSummaryData } from './dashboard.types';

export class DashboardService {
  private static TTL_SECONDS = parseInt(process.env.DASHBOARD_CACHE_TTL_SECONDS || '60', 10);

  public static async getSummary(householdId: string, bypassCache: boolean = false): Promise<DashboardSummaryData> {
    const cacheKey = buildCacheKey('dashboard', householdId);

    // 1. Try cache if not bypassed
    if (!bypassCache) {
      try {
        const cached = await redis.get<DashboardSummaryData>(cacheKey);
        // Only return cache if it matches the current complete schema
        if (cached && cached.overallExpenses !== undefined && cached.upcomingBillsTotal !== undefined) {
          return {
            ...cached,
            cached: true,
          };
        }
      } catch (err) {
        console.warn('[DashboardService] Cache read error, falling back to database query.');
      }
    }

    // 2. Aggregate fresh data from database
    const freshData = await DashboardRepository.aggregateHouseholdData(householdId);

    // 3. Populate Redis Cache
    try {
      await redis.set(cacheKey, freshData, this.TTL_SECONDS);
    } catch (err) {
      console.warn('[DashboardService] Cache write error, proceeding without cache.');
    }

    return {
      ...freshData,
      cached: false,
    };
  }
}
