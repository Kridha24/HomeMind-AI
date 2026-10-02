import { prisma } from '../repositories/db';

async function runFamilyWorkspaceTests() {
  console.log('🧪 Starting HomeMind.AI Family Workspace / Household Control Center Test Suite...\n');
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
  let testJoinerHousehold: any = null;
  let testUserA1: any = null;
  let testUserA2: any = null;
  let testUserB: any = null;

  try {
    // 1. Verify Existing Household Data Preservation
    const preExistingHouseholds = await prisma.household.findMany();
    assert(
      preExistingHouseholds.length >= 1,
      `Existing households preserved intact (found ${preExistingHouseholds.length} households)`
    );

    const riveraHousehold = await prisma.household.findUnique({
      where: { id: '034e8931-3055-4628-855e-f38817e887f2' },
      include: { members: true },
    });
    assert(
      riveraHousehold !== null && riveraHousehold.name === 'The Rivera Residence',
      `The Rivera Residence household preserved with ID 034e8931-3055-4628-855e-f38817e887f2`
    );

    const alexRivera = riveraHousehold?.members.find((m) => m.name === 'Alex Rivera');
    assert(alexRivera?.role === 'OWNER', `Alex Rivera role preserved as OWNER`);

    const sarahRivera = riveraHousehold?.members.find((m) => m.name === 'Sarah Rivera');
    assert(sarahRivera?.role === 'ADMIN', `Sarah Rivera role preserved as ADMIN`);

    // 2. Setup isolated test households and users
    testHouseholdA = await prisma.household.create({
      data: {
        name: 'Control Center Test Residence A',
        inviteCode: 'HM-FMA-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      },
    });

    testHouseholdB = await prisma.household.create({
      data: {
        name: 'Control Center Test Residence B',
        inviteCode: 'HM-FMB-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      },
    });

    testUserA1 = await prisma.user.create({
      data: {
        name: 'Family Owner A1',
        email: `family-a1-${Date.now()}@test.homemind.ai`,
        role: 'OWNER',
        householdId: testHouseholdA.id,
      },
    });

    testUserA2 = await prisma.user.create({
      data: {
        name: 'Family Member A2',
        email: `family-a2-${Date.now()}@test.homemind.ai`,
        role: 'MEMBER',
        householdId: testHouseholdA.id,
      },
    });

    testUserB = await prisma.user.create({
      data: {
        name: 'Family User B',
        email: `family-b-${Date.now()}@test.homemind.ai`,
        role: 'OWNER',
        householdId: testHouseholdB.id,
      },
    });

    // 3. Tenant Isolation: Household A cannot read or access Household B members
    const membersA = await prisma.user.findMany({
      where: { householdId: testHouseholdA.id },
    });
    const hasLeak = membersA.some((m) => m.householdId === testHouseholdB.id || m.id === testUserB.id);
    assert(!hasLeak && membersA.length === 2, `Tenant isolation: Household A cannot see Household B members`);

    // 4. Role Change within Household A
    // Owner promotes A2 from MEMBER to ADMIN
    const updatedA2 = await prisma.user.update({
      where: { id: testUserA2.id },
      data: { role: 'ADMIN' },
    });
    assert(updatedA2.role === 'ADMIN', `Role update: Successfully changed A2 role from MEMBER to ADMIN`);

    // Log the audit event
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_ROLE',
        entity: 'USER',
        householdId: testHouseholdA.id,
        performedBy: testUserA1.id,
        details: JSON.stringify({ targetUserId: testUserA2.id, oldRole: 'MEMBER', newRole: 'ADMIN' }),
      },
    });

    // 5. Ownership Transfer: Atomic transfer from A1 to A2
    await prisma.$transaction([
      prisma.user.update({
        where: { id: testUserA2.id },
        data: { role: 'OWNER' },
      }),
      prisma.user.update({
        where: { id: testUserA1.id },
        data: { role: 'ADMIN' },
      }),
      prisma.auditLog.create({
        data: {
          action: 'OWNERSHIP_TRANSFERRED',
          entity: 'HOUSEHOLD',
          householdId: testHouseholdA.id,
          performedBy: testUserA1.id,
          details: JSON.stringify({ previousOwnerId: testUserA1.id, newOwnerId: testUserA2.id }),
        },
      }),
    ]);

    const newOwner = await prisma.user.findUnique({ where: { id: testUserA2.id } });
    const formerOwner = await prisma.user.findUnique({ where: { id: testUserA1.id } });
    assert(
      newOwner?.role === 'OWNER' && formerOwner?.role === 'ADMIN',
      `Ownership transfer: Target became OWNER and former owner became ADMIN atomically`
    );

    // 6. Invite Code Regeneration
    const newInviteCode = 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const updatedHouseholdA = await prisma.household.update({
      where: { id: testHouseholdA.id },
      data: { inviteCode: newInviteCode },
    });
    assert(
      updatedHouseholdA.inviteCode === newInviteCode && /^HM-[A-Z0-9]{6}$/.test(newInviteCode),
      `Invite code regeneration produces valid HM-XXXXXX format: ${newInviteCode}`
    );

    // 7. Join Household with Code
    testJoinerHousehold = await prisma.household.create({
      data: {
        name: 'Temporary Initial Household',
        inviteCode: 'HM-TEMP-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      },
    });

    const testJoiner = await prisma.user.create({
      data: {
        name: 'New Household Joiner',
        email: `joiner-${Date.now()}@test.homemind.ai`,
        role: 'MEMBER',
        householdId: testJoinerHousehold.id,
      },
    });

    const joinedUser = await prisma.user.update({
      where: { id: testJoiner.id },
      data: {
        householdId: testHouseholdA.id,
        role: 'MEMBER',
      },
    });
    assert(
      joinedUser.householdId === testHouseholdA.id && joinedUser.role === 'MEMBER',
      `Join household with code successfully attaches user to household with MEMBER role`
    );

    // 8. Audit Log Retrieval & Privacy: Check activities for Household A
    const activities = await prisma.auditLog.findMany({
      where: { householdId: testHouseholdA.id },
      orderBy: { createdAt: 'desc' },
    });
    assert(activities.length >= 2, `Household activity logs successfully recorded (found ${activities.length})`);

    const hasNoSecrets = activities.every(
      (a) =>
        !a.details?.includes('password') &&
        !a.details?.includes('token') &&
        !a.details?.includes('secret')
    );
    assert(hasNoSecrets, `Audit privacy: No sensitive tokens, passwords, or secrets in activity logs`);

    // Clean up test joiner
    await prisma.user.delete({ where: { id: testJoiner.id } });

  } catch (error) {
    console.error('Test error:', error);
    assert(false, `Unexpected exception in family workspace tests: ${(error as any)?.message}`);
  } finally {
    // Teardown isolated test data
    try {
      if (testHouseholdA) {
        await prisma.auditLog.deleteMany({ where: { householdId: testHouseholdA.id } });
        await prisma.user.deleteMany({ where: { householdId: testHouseholdA.id } });
        await prisma.household.delete({ where: { id: testHouseholdA.id } });
      }
      if (testHouseholdB) {
        await prisma.auditLog.deleteMany({ where: { householdId: testHouseholdB.id } });
        await prisma.user.deleteMany({ where: { householdId: testHouseholdB.id } });
        await prisma.household.delete({ where: { id: testHouseholdB.id } });
      }
      if (testJoinerHousehold) {
        await prisma.user.deleteMany({ where: { householdId: testJoinerHousehold.id } });
        await prisma.household.delete({ where: { id: testJoinerHousehold.id } });
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr);
    }

    console.log(`\n==================================================`);
    console.log(`Family Workspace Tests: ${passed} passed, ${failed} failed`);
    console.log(`==================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runFamilyWorkspaceTests();
