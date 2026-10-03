import { DashboardRepository } from './dashboard.repository';
import { redis, buildCacheKey } from '../../infrastructure/redis/redisClient';
import { DashboardSummaryData } from './dashboard.types';
import { canViewHouseholdFinancials } from '../../utils/permissions';

export class DashboardService {
  private static TTL_SECONDS = parseInt(process.env.DASHBOARD_CACHE_TTL_SECONDS || '60', 10);

  public static async getSummary(
    householdId: string,
    userId: string = '',
    role: string = 'OWNER',
    bypassCache: boolean = false
  ): Promise<DashboardSummaryData> {
    const isOwnerOrCoOwner = canViewHouseholdFinancials(role);
    // Role & user scoped cache key prevents leaking cached financial records across roles (Part 43)
    const cacheKey = isOwnerOrCoOwner
      ? buildCacheKey('dashboard', `${householdId}:owner`)
      : buildCacheKey('dashboard', `${householdId}:member:${userId || 'anon'}`);

    // 1. Try cache if not bypassed
    if (!bypassCache) {
      try {
        const cached = await redis.get<DashboardSummaryData>(cacheKey);
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

    // 2. Aggregate fresh data from database according to caller's role
    const freshData = isOwnerOrCoOwner
      ? await DashboardRepository.aggregateHouseholdData(householdId)
      : await DashboardRepository.aggregateMemberData(householdId, userId);

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
