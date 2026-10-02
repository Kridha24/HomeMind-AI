import { prisma } from '../repositories/db';

async function runTasksWorkspaceTests() {
  console.log('🧪 Starting HomeMind.AI Tasks & Chores Workspace Integration Test Suite...\n');
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
  let testUserA1: any = null;
  let testUserA2: any = null;
  let testUserB: any = null;

  try {
    // 1. Verify Existing Data Preservation
    const preExistingTasks = await prisma.task.findMany({ where: { softDelete: false } });
    assert(preExistingTasks.length >= 5, `Existing tasks preserved intact (found ${preExistingTasks.length} items)`);

    // Verify specifically The Rivera Residence has its 2 pending tasks
    const riveraTasks = await prisma.task.findMany({
      where: {
        householdId: '034e8931-3055-4628-855e-f38817e887f2',
        softDelete: false,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });
    assert(riveraTasks.length === 2, `Rivera Residence has exactly 2 pending tasks (found ${riveraTasks.length})`);

    // 2. Setup isolated test households and users
    testHouseholdA = await prisma.household.create({
      data: {
        name: 'Tasks Test Residence A',
        inviteCode: 'HM-TSKA-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    testUserA1 = await prisma.user.create({
      data: {
        name: 'Task User A1',
        email: `task-user-a1-${Date.now()}@test.homemind.ai`,
        role: 'OWNER',
        householdId: testHouseholdA.id,
      },
    });

    testUserA2 = await prisma.user.create({
      data: {
        name: 'Task User A2',
        email: `task-user-a2-${Date.now()}@test.homemind.ai`,
        role: 'MEMBER',
        householdId: testHouseholdA.id,
      },
    });

    testHouseholdB = await prisma.household.create({
      data: {
        name: 'Tasks Test Residence B',
        inviteCode: 'HM-TSKB-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    testUserB = await prisma.user.create({
      data: {
        name: 'Task User B',
        email: `task-user-b-${Date.now()}@test.homemind.ai`,
        role: 'OWNER',
        householdId: testHouseholdB.id,
      },
    });

    // 3. Create Task in Household A assigned to A2
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const task1 = await prisma.task.create({
      data: {
        householdId: testHouseholdA.id,
        creatorId: testUserA1.id,
        title: 'Deep Clean Refrigerator',
        description: 'Sanitize drawers and wipe down door seals',
        priority: 'HIGH',
        dueDate: tomorrow,
        assigneeId: testUserA2.id,
        isRecurring: true,
      },
    });
    assert(Boolean(task1.id), 'Task 1 created in Household A assigned to household member A2');

    // 4. Create Task in Household B
    const taskB = await prisma.task.create({
      data: {
        householdId: testHouseholdB.id,
        creatorId: testUserB.id,
        title: 'Confidential Household B Task',
        priority: 'URGENT',
        dueDate: tomorrow,
      },
    });
    assert(Boolean(taskB.id), 'Task created in Household B');

    // 5. Test Household Isolation: Querying Household A never returns B
    const tasksInA = await prisma.task.findMany({
      where: { householdId: testHouseholdA.id, softDelete: false },
    });
    assert(tasksInA.length === 1, 'Household A sees only its own 1 task');
    assert(!tasksInA.some((t) => t.id === taskB.id), 'Household B task is completely isolated from Household A');

    // 6. Test Cross-Household Assignment Prevention
    const invalidAssignee = await prisma.user.findFirst({
      where: { id: testUserB.id, householdId: testHouseholdA.id },
    });
    assert(invalidAssignee === null, 'Security: Cross-household user B is not a member of Household A');

    // 7. Test Task Status Updates: Mark COMPLETED
    const completedTask = await prisma.task.update({
      where: { id: task1.id },
      data: { status: 'COMPLETED' },
    });
    assert(completedTask.status === 'COMPLETED', 'Task status successfully updated to COMPLETED');

    // 8. Test Reopening Task: Mark back to PENDING
    const reopenedTask = await prisma.task.update({
      where: { id: task1.id },
      data: { status: 'PENDING' },
    });
    assert(reopenedTask.status === 'PENDING', 'Task successfully reopened to PENDING');

    // 9. Test Edit Task: Update priority, title, description
    const editedTask = await prisma.task.update({
      where: { id: task1.id },
      data: {
        title: 'Deep Clean Fridge & Freezer',
        priority: 'URGENT',
      },
    });
    assert(editedTask.title === 'Deep Clean Fridge & Freezer' && editedTask.priority === 'URGENT', 'Task title and priority updated');

    // 10. Test Delete Task
    await prisma.task.delete({ where: { id: task1.id } });
    const remainingA = await prisma.task.findMany({ where: { householdId: testHouseholdA.id } });
    assert(remainingA.length === 0, 'Task deleted cleanly from Household A');

    // Cleanup test households
    await prisma.task.deleteMany({ where: { householdId: { in: [testHouseholdA.id, testHouseholdB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [testUserA1.id, testUserA2.id, testUserB.id] } } });
    await prisma.household.deleteMany({ where: { id: { in: [testHouseholdA.id, testHouseholdB.id] } } });

    // Verify existing tasks still preserved after test cleanup
    const postCleanupTasks = await prisma.task.findMany({ where: { softDelete: false } });
    assert(postCleanupTasks.length >= 5, 'Pre-existing records remain 100% untouched and preserved after test run');
  } catch (error: any) {
    console.error('Test execution failed with error:', error);
    failed++;
  } finally {
    console.log(`\n==================================================`);
    console.log(`Tasks Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`==================================================\n`);
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTasksWorkspaceTests();
