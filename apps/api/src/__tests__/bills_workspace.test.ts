import { prisma } from '../repositories/db';
import { BillRepository } from '../modules/bills/bill.repository';
import { BillService } from '../modules/bills/bill.service';
import { ExpenseService } from '../modules/finance/expenses/expense.service';
import { TransactionService } from '../modules/finance/transactions/transaction.service';

async function runBillsWorkspaceTests() {
  console.log('🧪 Starting HomeMind.AI Bills & Recurring Payments Workspace Integration Test Suite...\n');
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

  let testHouseholdA: any = null;
  let testHouseholdB: any = null;
  let testUserA: any = null;
  let testUserB: any = null;

  try {
    // 1. Setup isolated test households and users
    testHouseholdA = await prisma.household.create({
      data: {
        name: 'Bills Test Residence A',
        inviteCode: 'HM-BILA-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    testUserA = await prisma.user.create({
      data: {
        name: 'Bill User A',
        email: `bill-user-a-${Date.now()}@test.homemind.ai`,
        role: 'OWNER',
        householdId: testHouseholdA.id,
      },
    });

    testHouseholdB = await prisma.household.create({
      data: {
        name: 'Bills Test Residence B',
        inviteCode: 'HM-BILB-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    testUserB = await prisma.user.create({
      data: {
        name: 'Bill User B',
        email: `bill-user-b-${Date.now()}@test.homemind.ai`,
        role: 'OWNER',
        householdId: testHouseholdB.id,
      },
    });

    assert(Boolean(testHouseholdA?.id && testHouseholdB?.id), 'Test households created successfully');

    // 2. Create Bill atomically via BillService
    const dueDateA = new Date();
    dueDateA.setDate(dueDateA.getDate() + 5);

    const billA = await BillService.createBill(testHouseholdA.id, testUserA.id, {
      title: 'Airtel Broadband',
      category: 'Internet',
      amount: 1199,
      dueDate: dueDateA,
      provider: 'Airtel Xstream',
      notes: 'Due on the 5th of each month',
    });

    assert(Boolean(billA?.id), 'Bill created with ID');
    assert(billA.title === 'Airtel Broadband', 'Bill title matches');
    assert(billA.amount === 1199, 'Bill amount matches ₹1199');
    assert(billA.status === 'UNPAID', 'Bill initial status is UNPAID');
    assert(billA.householdId === testHouseholdA.id, 'Bill belongs to Household A');

    // 3. Tenant Isolation: Household B cannot see Household A bills
    const billsA = await BillService.getBills(testHouseholdA.id, testUserA.id, 'ADMIN');
    const billsB = await BillService.getBills(testHouseholdB.id, testUserB.id, 'ADMIN');

    assert(billsA.length === 1, 'Household A has 1 bill');
    assert(billsB.length === 0, 'Household B has 0 bills (strict isolation)');

    // 4. Mark Bill as Paid (Standard Manual Flow): atomically creates Expense & manual Transaction
    const paidDate = new Date();
    const updated = await BillService.markBillPaid(billA.id, testHouseholdA.id, testUserA.id, {
      paidDate,
      paymentMethod: 'UPI',
      notes: 'Paid via GPay',
    });

    assert(updated.status === 'PAID', 'Bill status updated to PAID');
    assert(Boolean(updated.paidAt), 'Bill paidAt timestamp is populated');
    assert(Boolean(updated.notes?.includes('Paid via GPay')), 'Bill notes reflect payment note');

    // Check linked Expense in DB
    const expenses = await prisma.expense.findMany({
      where: { householdId: testHouseholdA.id, softDelete: false },
    });
    assert(expenses.length === 1, 'Atomic Expense record created');
    assert(expenses[0].title === 'Paid Bill: Airtel Broadband', 'Expense title reflects paid bill');
    assert(expenses[0].amount === 1199, 'Expense amount matches bill amount');

    // Check linked manual Transaction in DB
    const transactions = await prisma.transaction.findMany({
      where: { householdId: testHouseholdA.id, softDelete: false },
    });
    assert(transactions.length === 1, 'Atomic Transaction record created');
    assert(transactions[0].type === 'DEBIT', 'Transaction is DEBIT');
    assert(transactions[0].paymentMethod === 'UPI', 'Transaction payment method recorded as UPI');
    assert(transactions[0].amount === 1199, 'Transaction amount matches ₹1199');
    assert(transactions[0].expenseId === expenses[0].id, 'Transaction linked to Expense ID');

    // 5. Mark Bill as Paid with Linked Existing Transaction: Prevents Duplicate Expense
    const dueDate2 = new Date();
    dueDate2.setDate(dueDate2.getDate() + 2);

    const electricityBill = await BillService.createBill(testHouseholdA.id, testUserA.id, {
      title: 'Bescom Electricity',
      category: 'Electricity',
      amount: 2450,
      dueDate: dueDate2,
      provider: 'BESCOM',
    });

    // Simulate an existing detected bank/UPI transaction that already has an Expense
    const existingExpense = await ExpenseService.createExpense(testHouseholdA.id, testUserA.id, {
      title: 'BESCOM Power Payment',
      amount: 2450,
      category: 'Utilities',
      date: new Date(),
    });

    const txsBefore = await prisma.transaction.findMany({
      where: { householdId: testHouseholdA.id, expenseId: existingExpense.id },
    });
    assert(txsBefore.length === 1, 'Transaction was created with expense');
    const existingTx = txsBefore[0];

    const expenseCountBefore = await prisma.expense.count({
      where: { householdId: testHouseholdA.id, softDelete: false },
    });

    // Mark the bill as paid, linking this existing detected transaction!
    const bill2Updated = await BillService.markBillPaid(electricityBill.id, testHouseholdA.id, testUserA.id, {
      linkedTransactionId: existingTx.id,
      notes: 'Matched with bank debit',
    });

    assert(bill2Updated.status === 'PAID', 'Bill marked PAID via linked transaction');

    // Verify ZERO duplicate expense was created
    const expenseCountAfter = await prisma.expense.count({
      where: { householdId: testHouseholdA.id, softDelete: false },
    });
    assert(expenseCountAfter === expenseCountBefore, 'Duplicate expense prevented when linking transaction');

    // 6. Soft Delete Bill preserves financial transactions and audit trail
    const tempBill = await BillService.createBill(testHouseholdA.id, testUserA.id, {
      title: 'Gym Membership',
      category: 'Fitness',
      amount: 1500,
      dueDate: new Date(),
    });

    await BillService.deleteBill(tempBill.id, testHouseholdA.id);

    const activeBills = await BillService.getBills(testHouseholdA.id, testUserA.id, 'ADMIN');
    assert(!activeBills.some((b) => b.id === tempBill.id), 'Deleted bill excluded from active bills');

    const dbRecord = await prisma.bill.findUnique({
      where: { id: tempBill.id },
    });
    assert(Boolean(dbRecord), 'Record remains in DB for audit trail');
    assert(dbRecord?.softDelete === true, 'Record is marked softDelete: true');

    // 7. Verify Existing Real Bills Data Preserved (e.g. pg rent ₹4000)
    const pgRentBill = await prisma.bill.findFirst({
      where: { title: 'pg rent', softDelete: false },
    });
    assert(Boolean(pgRentBill), 'Existing user bill "pg rent" is preserved');
    assert(pgRentBill?.amount === 4000, 'Existing bill amount is exactly ₹4000');
    assert(pgRentBill?.status === 'UNPAID', 'Existing bill status is UNPAID');

  } catch (err: any) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    // Cleanup only test households
    if (testHouseholdA || testHouseholdB) {
      const ids = [testHouseholdA?.id, testHouseholdB?.id].filter(Boolean);
      await prisma.transaction.deleteMany({ where: { householdId: { in: ids } } });
      await prisma.expense.deleteMany({ where: { householdId: { in: ids } } });
      await prisma.bill.deleteMany({ where: { householdId: { in: ids } } });
      await prisma.outboxEvent.deleteMany({ where: { householdId: { in: ids } } });
      await prisma.user.deleteMany({ where: { householdId: { in: ids } } });
      await prisma.household.deleteMany({ where: { id: { in: ids } } });
    }
  }

  console.log(`\n==================================================`);
  console.log(`BILLS WORKSPACE SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runBillsWorkspaceTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
