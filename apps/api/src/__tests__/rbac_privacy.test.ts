import { prisma } from '../repositories/db';
import {
  canViewHouseholdFinancials,
  canViewOtherMemberFinancials,
  canViewHouseholdAnalytics,
  canPromoteCoOwner,
  canManageRoles,
} from '../utils/permissions';
import {
  getMemberOverview,
  getMemberFinancialSummary,
  getAggregateData,
  updateMemberRole,
} from '../controllers/familyController';
import { exportMonthlyReport } from '../controllers/reportController';
import { AnalyticsController } from '../modules/analytics/analytics.controller';
import { ActionExecutor } from '../modules/copilot/actionExecutor';
import { ExpenseService } from '../modules/finance/expenses/expense.service';
import { IncomeService } from '../modules/finance/income/income.service';

// Mock Response Helper
function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
    setHeader() {
      return this;
    },
    send(data: any) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function runRBACPrivacyTestSuite() {
  console.log('🧪 Starting HomeMind.AI RBAC Privacy & Member Visibility Test Suite...\n');
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

  let hA: any = null;
  let hB: any = null;
  let ownerA: any = null;
  let coOwnerA: any = null;
  let memberA: any = null;
  let guestA: any = null;
  let adminA: any = null;
  let memberB: any = null;
  let testExpenseA: any = null;
  let testIncomeA: any = null;

  try {
    // ----------------------------------------------------
    // TEST 1: Centralized Permissions Unit Logic
    // ----------------------------------------------------
    console.log('--- Test 1: Centralized RBAC Permissions Matrix ---');
    assert(canViewHouseholdFinancials('OWNER') === true, 'OWNER has canViewHouseholdFinancials');
    assert(canViewHouseholdFinancials('CO-OWNER') === true, 'CO-OWNER has canViewHouseholdFinancials');
    assert(canViewHouseholdFinancials('CO_OWNER') === true, 'CO_OWNER normalized has canViewHouseholdFinancials');
    assert(canViewHouseholdFinancials('MEMBER') === false, 'MEMBER is denied canViewHouseholdFinancials');
    assert(canViewHouseholdFinancials('GUEST') === false, 'GUEST is denied canViewHouseholdFinancials');
    assert(canViewHouseholdFinancials('ADMIN') === false, 'ADMIN is denied canViewHouseholdFinancials unless promoted');

    assert(canViewOtherMemberFinancials('OWNER') === true, 'OWNER has canViewOtherMemberFinancials');
    assert(canViewOtherMemberFinancials('CO-OWNER') === true, 'CO-OWNER has canViewOtherMemberFinancials');
    assert(canViewOtherMemberFinancials('MEMBER') === false, 'MEMBER is denied canViewOtherMemberFinancials');
    assert(canViewOtherMemberFinancials('GUEST') === false, 'GUEST is denied canViewOtherMemberFinancials');

    assert(canViewHouseholdAnalytics('OWNER') === true, 'OWNER has canViewHouseholdAnalytics');
    assert(canViewHouseholdAnalytics('CO-OWNER') === true, 'CO-OWNER has canViewHouseholdAnalytics');
    assert(canViewHouseholdAnalytics('MEMBER') === false, 'MEMBER is denied canViewHouseholdAnalytics');
    assert(canViewHouseholdAnalytics('GUEST') === false, 'GUEST is denied canViewHouseholdAnalytics');

    assert(canPromoteCoOwner('OWNER') === true, 'OWNER can promote CO-OWNER');
    assert(canPromoteCoOwner('CO-OWNER') === false, 'CO-OWNER cannot promote another CO-OWNER');
    assert(canPromoteCoOwner('ADMIN') === false, 'ADMIN cannot promote CO-OWNER');
    assert(canPromoteCoOwner('MEMBER') === false, 'MEMBER cannot promote CO-OWNER');

    // ----------------------------------------------------
    // Setup Isolated Test Fixtures in Database
    // ----------------------------------------------------
    console.log('\n--- Setup Test Households & Members ---');
    hA = await prisma.household.create({
      data: {
        name: 'RBAC Test Residence A',
        inviteCode: 'HM-RBAC-A-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    hB = await prisma.household.create({
      data: {
        name: 'RBAC Test Residence B',
        inviteCode: 'HM-RBAC-B-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    ownerA = await prisma.user.create({
      data: {
        name: 'Anil Owner',
        email: `anil-${Date.now()}@rbac.test`,
        role: 'OWNER',
        householdId: hA.id,
      },
    });

    coOwnerA = await prisma.user.create({
      data: {
        name: 'Kavita CoOwner',
        email: `kavita-${Date.now()}@rbac.test`,
        role: 'CO-OWNER',
        householdId: hA.id,
      },
    });

    memberA = await prisma.user.create({
      data: {
        name: 'Rahul Member',
        email: `rahul-${Date.now()}@rbac.test`,
        role: 'MEMBER',
        householdId: hA.id,
      },
    });

    guestA = await prisma.user.create({
      data: {
        name: 'Geeta Guest',
        email: `geeta-${Date.now()}@rbac.test`,
        role: 'GUEST',
        householdId: hA.id,
      },
    });

    adminA = await prisma.user.create({
      data: {
        name: 'Amit Admin',
        email: `amit-${Date.now()}@rbac.test`,
        role: 'ADMIN',
        householdId: hA.id,
      },
    });

    memberB = await prisma.user.create({
      data: {
        name: 'External Member B',
        email: `ext-${Date.now()}@rbac.test`,
        role: 'MEMBER',
        householdId: hB.id,
      },
    });

    // Create member tasks, incomes, and expenses
    await prisma.task.create({
      data: {
        title: 'Rahul Room Cleaning',
        householdId: hA.id,
        assigneeId: memberA.id,
        creatorId: ownerA.id,
        dueDate: new Date(),
        status: 'PENDING',
      },
    });

    testIncomeA = await prisma.income.create({
      data: {
        title: 'Rahul Salary',
        amount: 50000,
        source: 'Software Job',
        householdId: hA.id,
        createdBy: memberA.id,
        date: new Date(),
      },
    });

    testExpenseA = await prisma.expense.create({
      data: {
        title: 'Rahul Gym Membership',
        amount: 2500,
        category: 'Fitness',
        householdId: hA.id,
        userId: memberA.id,
        date: new Date(),
      },
    });

    // Create a transaction attributed to Rahul
    await prisma.transaction.create({
      data: {
        merchant: 'Rahul Personal Purchase',
        amount: 1200,
        type: 'DEBIT',
        category: 'Shopping',
        householdId: hA.id,
        userId: memberA.id,
        occurredAt: new Date(),
      },
    });

    // ----------------------------------------------------
    // TEST 2: Member Overview Privacy (/family/members/:id/overview)
    // ----------------------------------------------------
    console.log('\n--- Test 2: Member Overview Privacy ---');

    // OWNER viewing Member Rahul
    const reqOwner: any = {
      user: { userId: ownerA.id, householdId: hA.id, role: 'OWNER' },
      params: { memberId: memberA.id },
    };
    const resOwner = createMockRes();
    await getMemberOverview(reqOwner, resOwner);
    assert(resOwner.statusCode === 200, 'OWNER gets 200 on member overview');
    assert(resOwner.body?.profile?.name === 'Rahul Member', 'OWNER receives Rahul profile');
    assert(resOwner.body?.finance !== null, 'OWNER receives member finance data');
    assert(resOwner.body?.finance?.totalIncome === 50000, 'OWNER sees Rahul real income (50,000)');
    assert(resOwner.body?.finance?.totalExpenses === 2500, 'OWNER sees Rahul real expenses (2,500)');

    // CO-OWNER viewing Member Rahul
    const reqCoOwner: any = {
      user: { userId: coOwnerA.id, householdId: hA.id, role: 'CO-OWNER' },
      params: { memberId: memberA.id },
    };
    const resCoOwner = createMockRes();
    await getMemberOverview(reqCoOwner, resCoOwner);
    assert(resCoOwner.statusCode === 200, 'CO-OWNER gets 200 on member overview');
    assert(resCoOwner.body?.finance !== null, 'CO-OWNER receives member finance data');
    assert(resCoOwner.body?.finance?.totalIncome === 50000, 'CO-OWNER sees Rahul real income');

    // MEMBER (Rahul) viewing another MEMBER or OWNER (Anil)
    const reqMemberViewingOwner: any = {
      user: { userId: memberA.id, householdId: hA.id, role: 'MEMBER' },
      params: { memberId: ownerA.id },
    };
    const resMemberViewingOwner = createMockRes();
    await getMemberOverview(reqMemberViewingOwner, resMemberViewingOwner);
    assert(resMemberViewingOwner.statusCode === 200, 'MEMBER gets 200 on owner profile collaboration info');
    assert(resMemberViewingOwner.body?.profile?.name === 'Anil Owner', 'MEMBER sees basic owner info');
    assert(resMemberViewingOwner.body?.finance === null, 'MEMBER viewing OWNER strictly receives finance: null (NO financial leak)');

    // GUEST viewing Member Rahul
    const reqGuestViewingMember: any = {
      user: { userId: guestA.id, householdId: hA.id, role: 'GUEST' },
      params: { memberId: memberA.id },
    };
    const resGuest = createMockRes();
    await getMemberOverview(reqGuestViewingMember, resGuest);
    assert(resGuest.statusCode === 200, 'GUEST gets 200 on member profile');
    assert(resGuest.body?.finance === null, 'GUEST viewing MEMBER strictly receives finance: null');

    // MEMBER viewing THEMSELVES: allowed to see their own records
    const reqMemberSelf: any = {
      user: { userId: memberA.id, householdId: hA.id, role: 'MEMBER' },
      params: { memberId: memberA.id },
    };
    const resMemberSelf = createMockRes();
    await getMemberOverview(reqMemberSelf, resMemberSelf);
    assert(resMemberSelf.statusCode === 200, 'MEMBER viewing self gets 200');
    assert(resMemberSelf.body?.finance !== null, 'MEMBER viewing self can see their own personal finance totals');

    // ----------------------------------------------------
    // TEST 3: Member Financial Summary Direct Endpoint (/family/members/:id/financial-summary)
    // ----------------------------------------------------
    console.log('\n--- Test 3: Direct Financial Summary Endpoint Security ---');
    const reqDirectOwner: any = {
      user: { userId: ownerA.id, householdId: hA.id, role: 'OWNER' },
      params: { memberId: memberA.id },
    };
    const resDirectOwner = createMockRes();
    await getMemberFinancialSummary(reqDirectOwner, resDirectOwner);
    assert(resDirectOwner.statusCode === 200, 'OWNER direct financial summary returns 200');

    const reqDirectCoOwner: any = {
      user: { userId: coOwnerA.id, householdId: hA.id, role: 'CO-OWNER' },
      params: { memberId: memberA.id },
    };
    const resDirectCoOwner = createMockRes();
    await getMemberFinancialSummary(reqDirectCoOwner, resDirectCoOwner);
    assert(resDirectCoOwner.statusCode === 200, 'CO-OWNER direct financial summary returns 200');

    const reqDirectMember: any = {
      user: { userId: memberA.id, householdId: hA.id, role: 'MEMBER' },
      params: { memberId: ownerA.id },
    };
    const resDirectMember = createMockRes();
    await getMemberFinancialSummary(reqDirectMember, resDirectMember);
    assert(resDirectMember.statusCode === 403, 'MEMBER direct financial summary attack blocked with 403 Forbidden');

    const reqDirectGuest: any = {
      user: { userId: guestA.id, householdId: hA.id, role: 'GUEST' },
      params: { memberId: memberA.id },
    };
    const resDirectGuest = createMockRes();
    await getMemberFinancialSummary(reqDirectGuest, resDirectGuest);
    assert(resDirectGuest.statusCode === 403, 'GUEST direct financial summary attack blocked with 403 Forbidden');

    const reqDirectAdmin: any = {
      user: { userId: adminA.id, householdId: hA.id, role: 'ADMIN' },
      params: { memberId: memberA.id },
    };
    const resDirectAdmin = createMockRes();
    await getMemberFinancialSummary(reqDirectAdmin, resDirectAdmin);
    assert(resDirectAdmin.statusCode === 403, 'ADMIN without co-owner role blocked with 403 Forbidden');

    // ----------------------------------------------------
    // TEST 4: Aggregate Data Endpoint (/family/aggregate)
    // ----------------------------------------------------
    console.log('\n--- Test 4: Household Aggregate Financials Privacy ---');
    const reqAggOwner: any = {
      user: { userId: ownerA.id, householdId: hA.id, role: 'OWNER' },
    };
    const resAggOwner = createMockRes();
    await getAggregateData(reqAggOwner, resAggOwner);
    assert(resAggOwner.statusCode === 200, 'OWNER receives aggregate financial data');

    const reqAggMember: any = {
      user: { userId: memberA.id, householdId: hA.id, role: 'MEMBER' },
    };
    const resAggMember = createMockRes();
    await getAggregateData(reqAggMember, resAggMember);
    assert(resAggMember.statusCode === 403, 'MEMBER blocked from /family/aggregate with 403 Forbidden');

    // ----------------------------------------------------
    // TEST 5: Monthly Report Export Authorization (/reports/monthly/pdf)
    // ----------------------------------------------------
    console.log('\n--- Test 5: Monthly Report Export Authorization ---');
    const reqReportMember: any = {
      user: { userId: memberA.id, householdId: hA.id, role: 'MEMBER' },
    };
    const resReportMember = createMockRes();
    await exportMonthlyReport(reqReportMember, resReportMember);
    assert(resReportMember.statusCode === 403, 'MEMBER exporting financial report blocked with 403 Forbidden');

    const reqReportGuest: any = {
      user: { userId: guestA.id, householdId: hA.id, role: 'GUEST' },
    };
    const resReportGuest = createMockRes();
    await exportMonthlyReport(reqReportGuest, resReportGuest);
    assert(resReportGuest.statusCode === 403, 'GUEST exporting financial report blocked with 403 Forbidden');

    // ----------------------------------------------------
    // TEST 6: Household Financial Analytics Authorization (/analytics/household)
    // ----------------------------------------------------
    console.log('\n--- Test 6: Household Analytics Privacy ---');
    const reqAnalyticsMember: any = {
      user: { userId: memberA.id, householdId: hA.id, role: 'MEMBER' },
      query: {},
    };
    const resAnalyticsMember = createMockRes();
    await AnalyticsController.getHouseholdAnalytics(reqAnalyticsMember, resAnalyticsMember);
    assert(resAnalyticsMember.statusCode === 403, 'MEMBER fetching household analytics blocked with 403 Forbidden');

    // ----------------------------------------------------
    // TEST 7: Role Promotion & Live Revocation (MEMBER <-> CO-OWNER)
    // ----------------------------------------------------
    console.log('\n--- Test 7: Role Promotion & Immediate Revocation ---');
    // Non-owner attempting to promote someone to CO-OWNER
    const reqIllegalPromote: any = {
      user: { userId: adminA.id, householdId: hA.id, role: 'ADMIN' },
      params: { targetUserId: memberA.id },
      body: { role: 'CO-OWNER' },
    };
    const resIllegalPromote = createMockRes();
    await updateMemberRole(reqIllegalPromote, resIllegalPromote);
    assert(resIllegalPromote.statusCode === 403, 'ADMIN cannot promote member to CO-OWNER (403)');

    // OWNER promotes Rahul (MEMBER -> CO-OWNER)
    const reqPromote: any = {
      user: { userId: ownerA.id, householdId: hA.id, role: 'OWNER' },
      params: { targetUserId: memberA.id },
      body: { role: 'CO-OWNER' },
    };
    const resPromote = createMockRes();
    await updateMemberRole(reqPromote, resPromote);
    assert(resPromote.statusCode === 200, 'OWNER promotes MEMBER to CO-OWNER successfully');
    assert(resPromote.body?.user?.role === 'CO-OWNER', 'User role updated in DB to CO-OWNER');

    // Now Rahul (as CO-OWNER) accesses financial summary
    const reqPromotedDirect: any = {
      user: { userId: memberA.id, householdId: hA.id, role: 'CO-OWNER' },
      params: { memberId: ownerA.id },
    };
    const resPromotedDirect = createMockRes();
    await getMemberFinancialSummary(reqPromotedDirect, resPromotedDirect);
    assert(resPromotedDirect.statusCode === 200, 'Promoted CO-OWNER immediately gains full household visibility');

    // OWNER demotes Rahul (CO-OWNER -> MEMBER)
    const reqDemote: any = {
      user: { userId: ownerA.id, householdId: hA.id, role: 'OWNER' },
      params: { targetUserId: memberA.id },
      body: { role: 'MEMBER' },
    };
    const resDemote = createMockRes();
    await updateMemberRole(reqDemote, resDemote);
    assert(resDemote.statusCode === 200, 'OWNER demotes CO-OWNER back to MEMBER');
    assert(resDemote.body?.user?.role === 'MEMBER', 'User role in DB reverted to MEMBER');

    // Demoted Rahul tries to access financial summary again
    const reqDemotedDirect: any = {
      user: { userId: memberA.id, householdId: hA.id, role: 'MEMBER' },
      params: { memberId: ownerA.id },
    };
    const resDemotedDirect = createMockRes();
    await getMemberFinancialSummary(reqDemotedDirect, resDemotedDirect);
    assert(resDemotedDirect.statusCode === 403, 'Demoted MEMBER immediately loses financial visibility (403)');

    // ----------------------------------------------------
    // TEST 8: Cross-Household Tenant Boundary Isolation
    // ----------------------------------------------------
    console.log('\n--- Test 8: Tenant Boundary Isolation ---');
    const reqCrossHousehold: any = {
      user: { userId: ownerA.id, householdId: hA.id, role: 'OWNER' },
      params: { memberId: memberB.id },
    };
    const resCross = createMockRes();
    await getMemberOverview(reqCrossHousehold, resCross);
    assert(resCross.statusCode === 404, 'Owner of Household A cannot view Member of Household B (404 Not Found)');

    // ----------------------------------------------------
    // TEST 9: AI Copilot Action RBAC Privacy
    // ----------------------------------------------------
    console.log('\n--- Test 9: AI Copilot RBAC Enforcement ---');
    // Normal member asking for Rahul's finance via AI Copilot
    const copilotMemberResult = await ActionExecutor.execute(
      'getFinanceSummary',
      { targetMemberName: 'Rahul Member' },
      {
        userId: guestA.id,
        householdId: hA.id,
        userRole: 'GUEST',
        userName: 'Geeta Guest',
        currencySymbol: '₹',
      }
    );
    assert(copilotMemberResult.success === false, 'AI Copilot denies non-owner request for another member finance');
    assert(
      copilotMemberResult.message.includes('Privacy policy') || copilotMemberResult.message.includes('permission'),
      'AI Copilot returns privacy policy explanation to restricted role'
    );

    // OWNER asking for member finance via AI Copilot
    const copilotOwnerResult = await ActionExecutor.execute(
      'getFinanceSummary',
      { targetMemberName: 'Rahul Member' },
      {
        userId: ownerA.id,
        householdId: hA.id,
        userRole: 'OWNER',
        userName: 'Anil Owner',
        currencySymbol: '₹',
      }
    );
    assert(copilotOwnerResult.success === true, 'AI Copilot permits OWNER to retrieve member finance');
    assert(copilotOwnerResult.data?.isTargetMember === true, 'AI Copilot returns target member metrics to owner');

    // ----------------------------------------------------
    // TEST 10: Expense & Income Modification Privacy
    // ----------------------------------------------------
    console.log('\n--- Test 10: Financial Record Mutation Privacy ---');
    // Normal member trying to delete another member's expense
    let deleteBlocked = false;
    try {
      await ExpenseService.deleteExpense(testExpenseA.id, hA.id, guestA.id, 'GUEST');
    } catch (e: any) {
      deleteBlocked = true;
      assert(e.message.includes('Forbidden'), 'Deleting another member expense throws Forbidden error');
    }
    assert(deleteBlocked, 'Non-owner blocked from deleting other member expense');

    // Normal member trying to delete another member's income
    let incomeDeleteBlocked = false;
    try {
      await IncomeService.deleteIncome(testIncomeA.id, hA.id, guestA.id, 'GUEST');
    } catch (e: any) {
      incomeDeleteBlocked = true;
      assert(e.message.includes('Forbidden'), 'Deleting another member income throws Forbidden error');
    }
    assert(incomeDeleteBlocked, 'Non-owner blocked from deleting other member income');

  } catch (error: any) {
    console.error('💥 Unhandled error in test suite:', error);
    failed++;
  } finally {
    console.log('\n--- Cleaning Up Test Data ---');
    if (testExpenseA) await prisma.expense.deleteMany({ where: { id: testExpenseA.id } });
    if (testIncomeA) await prisma.income.deleteMany({ where: { id: testIncomeA.id } });
    if (hA) {
      await prisma.transaction.deleteMany({ where: { householdId: hA.id } });
      await prisma.task.deleteMany({ where: { householdId: hA.id } });
      await prisma.auditLog.deleteMany({ where: { householdId: hA.id } });
      await prisma.user.deleteMany({ where: { householdId: hA.id } });
      await prisma.household.deleteMany({ where: { id: hA.id } });
    }
    if (hB) {
      await prisma.user.deleteMany({ where: { householdId: hB.id } });
      await prisma.household.deleteMany({ where: { id: hB.id } });
    }
    await prisma.$disconnect();

    console.log(`\n========================================`);
    console.log(`RBAC PRIVACY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runRBACPrivacyTestSuite();
