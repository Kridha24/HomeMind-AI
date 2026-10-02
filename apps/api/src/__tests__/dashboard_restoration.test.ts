import { prisma } from '@homemind/database';
import { DashboardRepository } from '../modules/dashboard/dashboard.repository';
import { DashboardService } from '../modules/dashboard/dashboard.service';
import { invalidateHouseholdDashboard } from '../infrastructure/redis/redisClient';

async function runDashboardRestorationTest() {
  console.log('🧪 Starting Dashboard Data Restoration & Integrity Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Find our primary test household from existing DB
    const household = await prisma.household.findFirst({
      where: {
        expenses: { some: {} },
      },
      include: {
        _count: {
          select: { expenses: true, incomes: true, bills: true, tasks: true },
        },
      },
    });

    assert(!!household, 'Existing household with historical data found in database');

    if (household) {
      console.log(`     (Testing Household: ${household.id} - "${household.name}")`);
      console.log(`     (Record counts: Expenses=${household._count.expenses}, Incomes=${household._count.incomes}, Bills=${household._count.bills}, Tasks=${household._count.tasks})`);

      // 2. Aggregate data via DashboardRepository
      const summary = await DashboardRepository.aggregateHouseholdData(household.id);

      assert(typeof summary === 'object', 'Summary data returned as object');
      assert(summary.overallExpenses > 0, `overallExpenses reflects persisted expenses (>0): ₹${summary.overallExpenses}`);
      assert(summary.overallIncome > 0, `overallIncome reflects persisted income (>0): ₹${summary.overallIncome}`);
      assert(summary.overallSavings !== undefined, `overallSavings is calculated: ₹${summary.overallSavings}`);
      assert(summary.metrics.allTimeExpenses === summary.overallExpenses, 'metrics.allTimeExpenses matches overallExpenses');
      assert(summary.metrics.allTimeIncome === summary.overallIncome, 'metrics.allTimeIncome matches overallIncome');
      assert(summary.upcomingBillsTotal > 0, `upcomingBillsTotal reflects unpaid bills (>0): ₹${summary.upcomingBillsTotal}`);
      assert(Array.isArray(summary.recent5History), 'recent5History is an array');
      assert(summary.recent5History.length > 0, `recent5History has items (${summary.recent5History.length})`);
      assert(Array.isArray(summary.pendingTasks), 'pendingTasks is an array');
      assert(summary.pendingTasks.length > 0, `pendingTasks has items (${summary.pendingTasks.length})`);

      // 3. Test Invalidation
      await invalidateHouseholdDashboard(household.id);
      assert(true, 'invalidateHouseholdDashboard executes cleanly for household');

      // 4. Test Service Fetch
      const serviceSummary = await DashboardService.getSummary(household.id);
      assert(serviceSummary.overallExpenses === summary.overallExpenses, 'DashboardService returns identical accurate aggregates');
      assert(serviceSummary.upcomingBillsTotal === summary.upcomingBillsTotal, 'DashboardService returns correct upcoming bills total');
    }

    console.log(`\nDashboard Restoration Results: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runDashboardRestorationTest();
