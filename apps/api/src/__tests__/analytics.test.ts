import { prisma } from '../repositories/db';
import { AnalyticsService } from '../modules/analytics/analytics.service';

async function runAnalyticsTests() {
  console.log('🧪 Starting HomeMind Analytics Engine Automated Test Suite...\n');
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

  function assertNoBadNumbers(obj: any, path = ''): void {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'number') {
      if (Number.isNaN(obj)) {
        throw new Error(`Found NaN at ${path}`);
      }
      if (!Number.isFinite(obj)) {
        throw new Error(`Found non-finite number at ${path}: ${obj}`);
      }
      return;
    }
    if (typeof obj === 'string') {
      if (obj.includes('NaN') || obj.includes('undefined%') || obj.includes('Infinity')) {
        throw new Error(`Found malformed string at ${path}: ${obj}`);
      }
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => assertNoBadNumbers(item, `${path}[${idx}]`));
      return;
    }
    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        assertNoBadNumbers(value, path ? `${path}.${key}` : key);
      }
    }
  }

  let emptyHousehold: any;
  let testHouseholdA: any;
  let testHouseholdB: any;
  let userA: any;
  let userB: any;

  try {
    // ------------------------------------------------------------------------
    // SETUP
    // ------------------------------------------------------------------------
    emptyHousehold = await prisma.household.create({
      data: {
        name: 'Empty Analytics Test Household',
        inviteCode: 'HM-E-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      },
    });

    testHouseholdA = await prisma.household.create({
      data: {
        name: 'Analytics Test Household Alpha',
        inviteCode: 'HM-A-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      },
    });

    testHouseholdB = await prisma.household.create({
      data: {
        name: 'Analytics Test Household Beta',
        inviteCode: 'HM-B-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      },
    });

    userA = await prisma.user.create({
      data: {
        email: `analytics_user_a_${Date.now()}@test.internal`,
        name: 'Alice Alpha',
        householdId: testHouseholdA.id,
        role: 'OWNER',
        isActive: true,
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `analytics_user_b_${Date.now()}@test.internal`,
        name: 'Bob Beta',
        householdId: testHouseholdB.id,
        role: 'OWNER',
        isActive: true,
      },
    });

    // Populate Household A with known data:
    // 1. Current month expense
    const now = new Date();
    const exp1 = await prisma.expense.create({
      data: {
        householdId: testHouseholdA.id,
        userId: userA.id,
        title: 'Electricity Utility Bill',
        amount: 3500,
        category: 'Utilities',
        date: now,
      },
    });

    // Mirrored transaction for exp1 (Must not double count)
    await prisma.transaction.create({
      data: {
        householdId: testHouseholdA.id,
        userId: userA.id,
        amount: 3500,
        type: 'DEBIT',
        category: 'Utilities',
        occurredAt: now,
        expenseId: exp1.id,
        status: 'CONFIRMED',
      },
    });

    // 2. Historical expense (3 months ago)
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15);
    await prisma.expense.create({
      data: {
        householdId: testHouseholdA.id,
        userId: userA.id,
        title: 'Old Furniture',
        amount: 12000,
        category: 'Home',
        date: threeMonthsAgo,
      },
    });

    // 3. Standalone debit transaction (Unlinked to expense)
    await prisma.transaction.create({
      data: {
        householdId: testHouseholdA.id,
        userId: userA.id,
        amount: 500,
        type: 'DEBIT',
        merchant: 'Coffee Shop',
        category: 'Food',
        occurredAt: now,
        status: 'CONFIRMED',
      },
    });

    // 4. Current month Income
    await prisma.income.create({
      data: {
        householdId: testHouseholdA.id,
        title: 'Consulting Retainer',
        amount: 25000,
        source: 'Consulting',
        date: now,
      },
    });

    // 5. Bills (1 paid, 1 unpaid)
    await prisma.bill.create({
      data: {
        householdId: testHouseholdA.id,
        title: 'Fiber Internet',
        amount: 999,
        category: 'Internet',
        dueDate: now,
        status: 'PAID',
        paidAt: now,
      },
    });

    await prisma.bill.create({
      data: {
        householdId: testHouseholdA.id,
        title: 'Water Tax',
        amount: 450,
        category: 'Water',
        dueDate: new Date(now.getTime() + 86400000 * 5),
        status: 'UNPAID',
      },
    });

    // 6. Tasks (2 completed, 1 pending)
    await prisma.task.create({
      data: {
        householdId: testHouseholdA.id,
        creatorId: userA.id,
        title: 'Sweep Patio',
        status: 'COMPLETED',
        dueDate: now,
      },
    });
    await prisma.task.create({
      data: {
        householdId: testHouseholdA.id,
        creatorId: userA.id,
        title: 'Fix Leaky Faucet',
        status: 'COMPLETED',
        dueDate: now,
      },
    });
    await prisma.task.create({
      data: {
        householdId: testHouseholdA.id,
        creatorId: userA.id,
        title: 'Call Plumber',
        status: 'PENDING',
        dueDate: new Date(now.getTime() + 86400000 * 2),
      },
    });

    // 7. Groceries (1 low stock, 1 healthy)
    await prisma.groceryItem.create({
      data: {
        householdId: testHouseholdA.id,
        name: 'Whole Milk',
        category: 'Dairy',
        quantity: 0.5,
        unit: 'L',
        minThreshold: 1,
      },
    });
    await prisma.groceryItem.create({
      data: {
        householdId: testHouseholdA.id,
        name: 'Basmati Rice',
        category: 'Grains',
        quantity: 5,
        unit: 'kg',
        minThreshold: 2,
      },
    });

    // Populate Household B with separate data to test household isolation
    await prisma.expense.create({
      data: {
        householdId: testHouseholdB.id,
        userId: userB.id,
        title: 'Beta Household Secret Spend',
        amount: 99999,
        category: 'Luxury',
        date: now,
      },
    });

    // ------------------------------------------------------------------------
    // TEST 1: Empty Household - Zero Denominator Protection & No NaN
    // ------------------------------------------------------------------------
    console.log('--- Test 1: Empty Household Safe Normalization ---');
    const emptyAnalytics = await AnalyticsService.getHouseholdAnalytics(emptyHousehold.id);

    assert(emptyAnalytics.finance.allTimeExpenses === 0, 'Empty household all-time expenses = 0');
    assert(emptyAnalytics.finance.allTimeIncome === 0, 'Empty household all-time income = 0');
    assert(emptyAnalytics.finance.monthlyExpenses === 0, 'Empty household monthly expenses = 0');
    assert(emptyAnalytics.finance.savingsRate === null, 'Empty household savings rate is null (not NaN or Infinity)');
    assert(emptyAnalytics.bills.settlementRate === 0, 'Zero bills settlement rate is 0% (not undefined% or NaN%)');
    assert(emptyAnalytics.tasks.completionRate === 0, 'Zero tasks completion rate is 0% (not undefined% or NaN%)');
    assert(emptyAnalytics.categories.expenses.length === 0, 'Zero expense categories array is empty');
    assert(emptyAnalytics.categories.income.length === 0, 'Zero income sources array is empty');
    assert(emptyAnalytics.finance.transactionCount === 0, 'Zero transaction count is 0 (not NaN)');

    let badNumberErrorEmpty: any = null;
    try {
      assertNoBadNumbers(emptyAnalytics);
    } catch (e: any) {
      badNumberErrorEmpty = e.message;
    }
    assert(badNumberErrorEmpty === null, 'No NaN, undefined%, or Infinity in empty household response');

    // ------------------------------------------------------------------------
    // TEST 2: Active Household A - Financial Aggregations & Double-Counting Defense
    // ------------------------------------------------------------------------
    console.log('\n--- Test 2: Active Household A Financial Aggregations ---');
    const analyticsA = await AnalyticsService.getHouseholdAnalytics(testHouseholdA.id, { period: 'all' });

    // exp1 (3500) + furniture (12000) + standalone debit tx (500) = 16000
    // Mirrored transaction of exp1 MUST NOT be added again!
    assert(analyticsA.finance.allTimeExpenses === 16000, `All-time expenses correctly equals 16000 (actual: ${analyticsA.finance.allTimeExpenses})`);
    assert(analyticsA.finance.allTimeIncome === 25000, `All-time income correctly equals 25000 (actual: ${analyticsA.finance.allTimeIncome})`);
    assert(analyticsA.finance.allTimeNetCashFlow === 9000, `Net cash flow correctly equals +9000 (actual: ${analyticsA.finance.allTimeNetCashFlow})`);

    // In current month: exp1 (3500) + standalone tx (500) = 4000
    assert(analyticsA.finance.monthlyExpenses === 4000, `Monthly expenses correctly equals 4000 (actual: ${analyticsA.finance.monthlyExpenses})`);
    assert(analyticsA.finance.monthlyIncome === 25000, `Monthly income correctly equals 25000 (actual: ${analyticsA.finance.monthlyIncome})`);
    assert(analyticsA.finance.monthlyNetCashFlow === 21000, `Monthly net cash flow correctly equals 21000`);

    // Transactions count: 2 expenses + 1 standalone debit + 1 income = 4 transactions
    assert(analyticsA.finance.transactionCount === 4, `Total transactions analyzed correctly equals 4 (actual: ${analyticsA.finance.transactionCount})`);

    // ------------------------------------------------------------------------
    // TEST 3: Category Breakdown & Sorting
    // ------------------------------------------------------------------------
    console.log('\n--- Test 3: Category Breakdown & Percentages ---');
    assert(analyticsA.categories.expenses.length === 3, '3 expense categories discovered (Home, Utilities, Food)');
    assert(analyticsA.categories.expenses[0].category === 'Home', 'Highest category is Home (12000)');
    assert(analyticsA.categories.expenses[0].amount === 12000, 'Home category amount = 12000');
    assert(analyticsA.categories.expenses[0].percentage === 75, 'Home is 75% of 16000');

    const totalPct = analyticsA.categories.expenses.reduce((sum, c) => sum + c.percentage, 0);
    assert(Math.round(totalPct) === 100, `Expense percentages sum to ~100% (actual: ${totalPct}%)`);

    // ------------------------------------------------------------------------
    // TEST 4: Bills, Tasks, and Groceries Telemetry
    // ------------------------------------------------------------------------
    console.log('\n--- Test 4: Operational Telemetry ---');
    assert(analyticsA.bills.total === 2, '2 total bills');
    assert(analyticsA.bills.paid === 1, '1 paid bill');
    assert(analyticsA.bills.unpaid === 1, '1 unpaid bill');
    assert(analyticsA.bills.settlementRate === 50, 'Bills settlement rate is 50%');

    assert(analyticsA.tasks.total === 3, '3 total tasks');
    assert(analyticsA.tasks.completed === 2, '2 completed tasks');
    assert(analyticsA.tasks.completionRate === 66.7, 'Tasks completion rate is 66.7%');

    assert(analyticsA.groceries.total === 2, '2 total groceries');
    assert(analyticsA.groceries.lowStock === 1, '1 low stock item');
    assert(analyticsA.groceries.healthyStock === 1, '1 healthy stock item');

    // ------------------------------------------------------------------------
    // TEST 5: Household Isolation (Multi-Tenancy)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 5: Household Isolation Verification ---');
    const analyticsB = await AnalyticsService.getHouseholdAnalytics(testHouseholdB.id);
    assert(analyticsB.finance.allTimeExpenses === 99999, 'Household B has isolated expenses of 99999');
    assert(!analyticsA.categories.expenses.some(c => c.category === 'Luxury'), 'Household A does NOT leak Household B luxury spend');
    assert(!analyticsB.categories.expenses.some(c => c.category === 'Utilities'), 'Household B does NOT leak Household A utilities spend');

    // ------------------------------------------------------------------------
    // TEST 6: Audit Against NaN, undefined%, or Infinity
    // ------------------------------------------------------------------------
    console.log('\n--- Test 6: Strict Data Contract & Type Audit ---');
    let badNumberErrorA: any = null;
    try {
      assertNoBadNumbers(analyticsA);
    } catch (e: any) {
      badNumberErrorA = e.message;
    }
    assert(badNumberErrorA === null, 'No NaN, undefined%, or Infinity anywhere in Household A analytics response');

    // ------------------------------------------------------------------------
    // TEST 7: Legacy Contract Field Verification
    // ------------------------------------------------------------------------
    console.log('\n--- Test 7: Backward Compatibility Contract ---');
    assert(typeof analyticsA.summary.billSettlementRate === 'number', 'summary.billSettlementRate is a valid number');
    assert(typeof analyticsA.summary.taskCompletionRate === 'number', 'summary.taskCompletionRate is a valid number');
    assert(typeof analyticsA.counts.expensesCount === 'number', 'counts.expensesCount is a valid number');
    assert(typeof analyticsA.counts.incomesCount === 'number', 'counts.incomesCount is a valid number');
    assert(typeof analyticsA.inventoryAnalytics.totalItems === 'number', 'inventoryAnalytics.totalItems is a valid number');

  } catch (err: any) {
    console.error('Test execution exception:', err);
    failed++;
  } finally {
    // Cleanup test records
    try {
      if (emptyHousehold) {
        await prisma.household.delete({ where: { id: emptyHousehold.id } });
      }
      if (testHouseholdA) {
        await prisma.transaction.deleteMany({ where: { householdId: testHouseholdA.id } });
        await prisma.expense.deleteMany({ where: { householdId: testHouseholdA.id } });
        await prisma.income.deleteMany({ where: { householdId: testHouseholdA.id } });
        await prisma.bill.deleteMany({ where: { householdId: testHouseholdA.id } });
        await prisma.task.deleteMany({ where: { householdId: testHouseholdA.id } });
        await prisma.groceryItem.deleteMany({ where: { householdId: testHouseholdA.id } });
        await prisma.user.deleteMany({ where: { householdId: testHouseholdA.id } });
        await prisma.household.delete({ where: { id: testHouseholdA.id } });
      }
      if (testHouseholdB) {
        await prisma.expense.deleteMany({ where: { householdId: testHouseholdB.id } });
        await prisma.user.deleteMany({ where: { householdId: testHouseholdB.id } });
        await prisma.household.delete({ where: { id: testHouseholdB.id } });
      }
    } catch (cleanupErr) {
      console.warn('Cleanup error:', cleanupErr);
    }
  }

  console.log(`\n==================================================`);
  console.log(`ANALYTICS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAnalyticsTests();
