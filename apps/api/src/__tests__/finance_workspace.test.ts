import { prisma } from '@homemind/database';
import { TransactionService } from '../modules/finance/transactions/transaction.service';
import { TransactionRepository } from '../modules/finance/transactions/transaction.repository';
import { ExpenseService } from '../modules/finance/expenses/expense.service';
import { IncomeService } from '../modules/finance/income/income.service';

async function runFinanceWorkspaceTestSuite() {
  console.log('🧪 Starting HomeMind.AI Finance & Transactions Workspace Integration Test Suite...\n');

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
    // 1. Setup isolated test household
    const testHousehold = await prisma.household.create({
      data: {
        name: 'Finance Test Residence',
        inviteCode: 'HM-FIN-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    const testUser = await prisma.user.create({
      data: {
        name: 'Finance Tester',
        email: `finance.tester.${Date.now()}@example.com`,
        role: 'OWNER',
        householdId: testHousehold.id,
      },
    });

    // 2. Test Expense creation atomically creates linked Transaction
    const exp1 = await ExpenseService.createExpense(testHousehold.id, testUser.id, {
      title: 'Swiggy Dinner',
      amount: 420.50,
      category: 'Dining & Food',
      date: new Date().toISOString(),
    });

    assert(Boolean(exp1 && exp1.id), 'Expense created successfully via ExpenseService');

    const linkedTx1 = await prisma.transaction.findFirst({
      where: { expenseId: exp1.id, householdId: testHousehold.id },
    });
    assert(Boolean(linkedTx1), 'Expense creation atomically created linked Transaction record');
    assert(linkedTx1?.type === 'DEBIT', 'Linked Transaction has type=DEBIT');
    assert(linkedTx1?.source === 'MANUAL', 'Linked Transaction has source=MANUAL');
    assert(linkedTx1?.amount === 420.50, 'Linked Transaction matches exact amount ₹420.50');

    // 3. Test Income creation atomically creates linked Transaction
    const inc1 = await IncomeService.createIncome(testHousehold.id, testUser.id, {
      title: 'Monthly Salary',
      amount: 45000,
      source: 'Salary',
      date: new Date().toISOString(),
    });

    assert(Boolean(inc1 && inc1.id), 'Income created successfully via IncomeService');

    const linkedTx2 = await prisma.transaction.findFirst({
      where: { incomeId: inc1.id, householdId: testHousehold.id },
    });
    assert(Boolean(linkedTx2), 'Income creation atomically created linked Transaction record');
    assert(linkedTx2?.type === 'CREDIT', 'Linked Income Transaction has type=CREDIT');
    assert(linkedTx2?.amount === 45000, 'Linked Income Transaction matches exact amount ₹45000');

    // 4. Test SMS transaction import
    const smsImport = await TransactionService.importSmsTransaction(testUser.id, testHousehold.id, {
      amount: 1250,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'DMart Supermarket',
      category: 'Groceries',
      bankName: 'HDFC',
      paymentMethod: 'UPI',
      accountLast4: '9876',
      reference: 'UPI/6253417281',
      occurredAt: new Date(),
      status: 'CONFIRMED',
    });

    assert(Boolean(smsImport.transaction && smsImport.transaction.id), 'SMS Transaction imported successfully');
    assert(smsImport.transaction.source === 'SMS', 'SMS Transaction has source=SMS');

    // 5. Test Query Filters
    // 5a. Filter by Type
    const debitsOnly = await TransactionService.getTransactions(testHousehold.id, testUser.id, 'OWNER', {
      type: 'DEBIT',
    });
    assert(debitsOnly.transactions.every((t) => t.type === 'DEBIT'), 'Filter by type=DEBIT returns only debits');
    assert(debitsOnly.transactions.length >= 2, 'Found at least 2 debit transactions (Swiggy + DMart)');

    // 5b. Filter by Category
    const groceriesOnly = await TransactionService.getTransactions(testHousehold.id, testUser.id, 'OWNER', {
      category: 'Groceries',
    });
    assert(groceriesOnly.transactions.every((t) => t.category === 'Groceries'), 'Filter by category=Groceries matches');

    // 5c. Filter by Search keyword
    const searchResult = await TransactionService.getTransactions(testHousehold.id, testUser.id, 'OWNER', {
      search: 'Swiggy',
    });
    assert(searchResult.transactions.length === 1 && searchResult.transactions[0].merchant === 'Swiggy Dinner', 'Search for "Swiggy" matches exact record');

    // 5d. Filter by Source
    const smsOnly = await TransactionService.getTransactions(testHousehold.id, testUser.id, 'OWNER', {
      source: 'SMS',
    });
    assert(smsOnly.transactions.every((t) => t.source === 'SMS'), 'Filter by source=SMS returns only SMS records');

    // 6. Test Stats & Summary calculation
    const stats = await TransactionService.getStats(testHousehold.id, testUser.id, 'OWNER');
    assert(stats.totalCount >= 3, `Stats totalCount is accurate (found: ${stats.totalCount})`);
    assert(stats.thisMonthSpent > 0, `thisMonthSpent reflects debits: ₹${stats.thisMonthSpent}`);
    assert(stats.thisMonthIncome >= 45000, `thisMonthIncome reflects credit: ₹${stats.thisMonthIncome}`);
    assert(stats.netCashFlow === stats.thisMonthIncome - stats.thisMonthSpent, 'netCashFlow = income - spent');
    assert(Boolean(stats.largestExpense), 'largestExpense identified correctly');
    assert(stats.categoryBreakdown.length > 0, 'categoryBreakdown calculated with percentages');

    // 7. Test Cascade Update
    await TransactionService.updateTransaction(testHousehold.id, testUser.id, 'OWNER', linkedTx1!.id, {
      category: 'Dining & Food Updated',
      merchant: 'Swiggy Fine Dining',
    });
    const updatedExp = await prisma.expense.findUnique({ where: { id: exp1.id } });
    assert(updatedExp?.category === 'Dining & Food Updated', 'Transaction update mirrored to linked Expense category');
    assert(updatedExp?.title === 'Swiggy Fine Dining', 'Transaction update mirrored to linked Expense title');

    // 8. Test Cascade Soft Delete
    await TransactionService.deleteTransaction(testHousehold.id, testUser.id, 'OWNER', linkedTx1!.id);
    const deletedExp = await prisma.expense.findUnique({ where: { id: exp1.id } });
    assert(deletedExp?.softDelete === true, 'Deleting Transaction cascades softDelete to linked Expense');

    // Clean up test data
    await prisma.transaction.deleteMany({ where: { householdId: testHousehold.id } });
    await prisma.expense.deleteMany({ where: { householdId: testHousehold.id } });
    await prisma.income.deleteMany({ where: { householdId: testHousehold.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.household.delete({ where: { id: testHousehold.id } });

    console.log(`\n==================================================`);
    console.log(`FINANCE WORKSPACE SUITE: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err: any) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runFinanceWorkspaceTestSuite();
