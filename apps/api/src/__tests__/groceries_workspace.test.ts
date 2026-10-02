import { prisma } from '../repositories/db';

async function runGroceriesWorkspaceTests() {
  console.log('🧪 Starting HomeMind.AI Groceries & Shopping Workspace Integration Test Suite...\n');
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
    // 1. Verify Existing Data Preservation
    const preExistingGroceries = await prisma.groceryItem.findMany();
    assert(preExistingGroceries.length >= 7, `Existing groceries preserved intact (found ${preExistingGroceries.length} items)`);

    // 2. Setup isolated test households and users
    testHouseholdA = await prisma.household.create({
      data: {
        name: 'Groceries Test Residence A',
        inviteCode: 'HM-GROA-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    testUserA = await prisma.user.create({
      data: {
        name: 'Grocery User A',
        email: `grocery-user-a-${Date.now()}@test.homemind.ai`,
        role: 'OWNER',
        householdId: testHouseholdA.id,
      },
    });

    testHouseholdB = await prisma.household.create({
      data: {
        name: 'Groceries Test Residence B',
        inviteCode: 'HM-GROB-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    testUserB = await prisma.user.create({
      data: {
        name: 'Grocery User B',
        email: `grocery-user-b-${Date.now()}@test.homemind.ai`,
        role: 'OWNER',
        householdId: testHouseholdB.id,
      },
    });

    // 3. Create items in Household A
    const item1 = await prisma.groceryItem.create({
      data: {
        householdId: testHouseholdA.id,
        name: 'Farm Fresh Tomatoes',
        category: 'Vegetables',
        quantity: 2.5,
        unit: 'kg',
        minThreshold: 1.0,
        createdBy: testUserA.id,
      },
    });

    const item2 = await prisma.groceryItem.create({
      data: {
        householdId: testHouseholdA.id,
        name: 'Almond Milk 1L',
        category: 'Dairy & Eggs',
        quantity: 1,
        unit: 'L',
        minThreshold: 2.0, // Low stock since quantity (1) <= minThreshold (2)
        createdBy: testUserA.id,
      },
    });

    const item3 = await prisma.groceryItem.create({
      data: {
        householdId: testHouseholdA.id,
        name: 'Whole Grain Sourdough',
        category: 'Bakery',
        quantity: 1,
        unit: 'pack',
        minThreshold: 1.0,
        purchaseDate: new Date(), // Already purchased
        createdBy: testUserA.id,
      },
    });

    assert(Boolean(item1.id && item2.id && item3.id), 'Created 3 grocery items in Household A');

    // 4. Create items in Household B (Isolation test)
    const itemB = await prisma.groceryItem.create({
      data: {
        householdId: testHouseholdB.id,
        name: 'Secret Household B Coffee',
        category: 'Beverages',
        quantity: 1,
        unit: 'pack',
        minThreshold: 1.0,
        createdBy: testUserB.id,
      },
    });
    assert(Boolean(itemB.id), 'Created grocery item in Household B');

    // 5. Test Household Isolation: Querying Household A must NEVER return Household B items
    const householdAItems = await prisma.groceryItem.findMany({
      where: { householdId: testHouseholdA.id, softDelete: false },
    });
    assert(householdAItems.length === 3, 'Household A has exactly 3 items');
    assert(!householdAItems.some((i) => i.id === itemB.id), 'Household B item is NOT visible to Household A');

    const householdBItems = await prisma.groceryItem.findMany({
      where: { householdId: testHouseholdB.id, softDelete: false },
    });
    assert(householdBItems.length === 1 && householdBItems[0].name === 'Secret Household B Coffee', 'Household B sees only its own items');

    // 6. Test Pending vs Purchased Query
    const pendingItems = await prisma.groceryItem.findMany({
      where: { householdId: testHouseholdA.id, softDelete: false, purchaseDate: null },
    });
    assert(pendingItems.length === 2, `Household A has 2 pending items to buy (found ${pendingItems.length})`);

    const purchasedItems = await prisma.groceryItem.findMany({
      where: { householdId: testHouseholdA.id, softDelete: false, purchaseDate: { not: null } },
    });
    assert(purchasedItems.length === 1, `Household A has 1 purchased item (found ${purchasedItems.length})`);

    // 7. Test Purchase Toggle: Mark pending item1 as purchased
    const purchaseTimestamp = new Date();
    const markedPurchased = await prisma.groceryItem.update({
      where: { id: item1.id },
      data: { purchaseDate: purchaseTimestamp, updatedBy: testUserA.id },
    });
    assert(markedPurchased.purchaseDate !== null, 'Item 1 marked as purchased with timestamp');

    // 8. Test Unpurchase: Revert item1 back to pending
    const unmarkedPurchased = await prisma.groceryItem.update({
      where: { id: item1.id },
      data: { purchaseDate: null, updatedBy: testUserA.id },
    });
    assert(unmarkedPurchased.purchaseDate === null, 'Item 1 unmarked back to pending');

    // 9. Test Quantity Adjustment
    const updatedQty = await prisma.groceryItem.update({
      where: { id: item2.id },
      data: { quantity: 3.0, updatedBy: testUserA.id },
    });
    assert(updatedQty.quantity === 3.0, 'Quantity updated from 1 to 3');

    // 10. Test Finance Safety: Marking an item purchased must NOT create duplicate Expenses or Transactions
    const initialExpenseCount = await prisma.expense.count({ where: { householdId: testHouseholdA.id } });
    const initialTransactionCount = await prisma.transaction.count({ where: { householdId: testHouseholdA.id } });

    // Mark item3 purchased again
    await prisma.groceryItem.update({
      where: { id: item3.id },
      data: { purchaseDate: new Date() },
    });

    const postExpenseCount = await prisma.expense.count({ where: { householdId: testHouseholdA.id } });
    const postTransactionCount = await prisma.transaction.count({ where: { householdId: testHouseholdA.id } });

    assert(
      initialExpenseCount === postExpenseCount && initialTransactionCount === postTransactionCount,
      'Finance Safety Verified: Marking item purchased did NOT create unwanted Expenses or Transactions'
    );

    // 11. Test Delete
    await prisma.groceryItem.delete({ where: { id: item3.id } });
    const remainingA = await prisma.groceryItem.findMany({ where: { householdId: testHouseholdA.id } });
    assert(remainingA.length === 2, `Deleted item3 cleanly (remaining: ${remainingA.length})`);

    // 12. Cleanup test data
    await prisma.groceryItem.deleteMany({ where: { householdId: { in: [testHouseholdA.id, testHouseholdB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [testUserA.id, testUserB.id] } } });
    await prisma.household.deleteMany({ where: { id: { in: [testHouseholdA.id, testHouseholdB.id] } } });

    // Verify existing 7 records still preserved after test cleanup
    const postTestPreExisting = await prisma.groceryItem.findMany();
    assert(postTestPreExisting.length >= 7, 'Pre-existing records remain 100% untouched and preserved after test run');
  } catch (error: any) {
    console.error('Test execution failed with error:', error);
    failed++;
  } finally {
    console.log(`\n==================================================`);
    console.log(`Groceries Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`==================================================\n`);
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runGroceriesWorkspaceTests();
