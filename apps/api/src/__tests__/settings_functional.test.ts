import { prisma } from '@homemind/database';
import * as familyController from '../controllers/familyController';
import * as authController from '../controllers/authController';
import * as settingController from '../controllers/settingController';

async function runSettingsFunctionalAudit() {
  console.log('🧪 Starting HomeMind.AI Settings Functional Audit & Backend Integration Test Suite...\n');

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

  // Mock Express Response helper
  const createMockRes = () => {
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.jsonData = data;
        return this;
      }
    };
    return res;
  };

  try {
    // Setup isolated test entities
    const testHousehold = await prisma.household.create({
      data: {
        name: 'Settings Audit Test Household',
        inviteCode: 'HM-AUDIT-' + Math.random().toString(36).substring(2, 6).toUpperCase()
      }
    });

    const ownerUser = await prisma.user.create({
      data: {
        name: 'Audit Owner',
        email: `audit.owner.${Date.now()}@example.com`,
        role: 'OWNER',
        householdId: testHousehold.id,
        provider: 'GOOGLE',
        isVerified: true
      }
    });

    const memberUser = await prisma.user.create({
      data: {
        name: 'Audit Member',
        email: `audit.member.${Date.now()}@example.com`,
        role: 'MEMBER',
        householdId: testHousehold.id,
        provider: 'PASSWORD',
        isVerified: false
      }
    });

    // Create session tokens for member
    const memberToken = await prisma.refreshToken.create({
      data: {
        tokenHash: 'audit_test_hash_' + Math.random(),
        userId: memberUser.id,
        device: 'Test Workstation Chrome',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 86400000)
      }
    });

    console.log(`     (Test Context: Household=${testHousehold.id}, Owner=${ownerUser.id}, Member=${memberUser.id})`);

    // 1. Test updateMemberRole with OWNER requester
    {
      const req: any = {
        user: { userId: ownerUser.id, householdId: testHousehold.id, role: 'OWNER' },
        params: { userId: memberUser.id },
        body: { role: 'ADMIN' }
      };
      const res = createMockRes();
      await familyController.updateMemberRole(req, res);
      assert(res.statusCode === 200 && res.jsonData?.user?.role === 'ADMIN', 'OWNER can update member role to ADMIN (RBAC fix verified)');
    }

    // 2. Test updateHouseholdName with OWNER requester
    {
      const req: any = {
        user: { userId: ownerUser.id, householdId: testHousehold.id, role: 'OWNER' },
        body: { name: 'Renamed Test Household' }
      };
      const res = createMockRes();
      await familyController.updateHouseholdName(req, res);
      assert(res.statusCode === 200 && res.jsonData?.household?.name === 'Renamed Test Household', 'OWNER can rename household (RBAC fix verified)');
    }

    // 3. Test getActiveSessions
    {
      const req: any = {
        user: { userId: memberUser.id, householdId: testHousehold.id, role: 'ADMIN' }
      };
      const res = createMockRes();
      await authController.getActiveSessions(req, res);
      assert(res.statusCode === 200 && Array.isArray(res.jsonData?.sessions) && res.jsonData.sessions.length >= 1, 'getActiveSessions returns real authenticated session records');
    }

    // 4. Test revokeSession
    {
      const req: any = {
        user: { userId: memberUser.id, householdId: testHousehold.id, role: 'ADMIN' },
        params: { sessionId: memberToken.id }
      };
      const res = createMockRes();
      await authController.revokeSession(req, res);
      assert(res.statusCode === 200 && res.jsonData?.success === true, 'revokeSession successfully invalidates specific refresh token in database');

      const tokenStillExists = await prisma.refreshToken.findUnique({ where: { id: memberToken.id } });
      assert(!tokenStillExists, 'Revoked token is completely deleted from database');
    }

    // 5. Test updateSettings (Server persistence)
    {
      const req: any = {
        user: { userId: ownerUser.id, householdId: testHousehold.id, role: 'OWNER' },
        body: {
          pushNotifications: false,
          emailAlerts: true,
          aiMemoryEnabled: true,
          proactiveAI: false,
          timeZone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          unitSystem: 'Metric'
        }
      };
      const res = createMockRes();
      await settingController.updateSettings(req, res);
      assert(res.statusCode === 200, 'updateSettings persists server-level preferences');
      assert(res.jsonData?.pushNotifications === false, 'pushNotifications saved on server');
      assert(res.jsonData?.proactiveAI === false, 'proactiveAI saved on server');
      assert(res.jsonData?.timeZone === 'Asia/Kolkata', 'timeZone saved on server');
    }

    // 6. Test removeHouseholdMember
    {
      const req: any = {
        user: { userId: ownerUser.id, householdId: testHousehold.id, role: 'OWNER' },
        params: { userId: memberUser.id }
      };
      const res = createMockRes();
      await familyController.removeHouseholdMember(req, res);
      assert(res.statusCode === 200 && res.jsonData?.success === true, 'removeHouseholdMember cleanly unlinks target user without deleting household data');

      const refreshedMember = await prisma.user.findUnique({ where: { id: memberUser.id } });
      assert(refreshedMember?.householdId !== testHousehold.id, 'Removed user is migrated to their own independent household');
    }

    // 7. Test leaveHousehold
    {
      // First test sole owner cannot leave without transfer
      const reqSole: any = {
        user: { userId: ownerUser.id, householdId: testHousehold.id, role: 'OWNER' }
      };
      const resSole = createMockRes();
      // Add a dummy member back to test the sole owner restriction
      await prisma.user.update({ where: { id: memberUser.id }, data: { householdId: testHousehold.id, role: 'MEMBER' } });
      await familyController.leaveHousehold(reqSole, resSole);
      assert(resSole.statusCode === 400, 'leaveHousehold rejects sole owner leaving when other members exist');

      // Now member leaves
      const reqMember: any = {
        user: { userId: memberUser.id, householdId: testHousehold.id, role: 'MEMBER' }
      };
      const resMember = createMockRes();
      await familyController.leaveHousehold(reqMember, resMember);
      assert(resMember.statusCode === 200 && resMember.jsonData?.success === true, 'leaveHousehold allows member to leave and provision personal household');
    }

    // 8. Test deleteHousehold
    {
      const req: any = {
        user: { userId: ownerUser.id, householdId: testHousehold.id, role: 'OWNER' },
        params: { id: testHousehold.id }
      };
      const res = createMockRes();
      await familyController.deleteHousehold(req, res);
      assert(res.statusCode === 200 && res.jsonData?.success === true, 'deleteHousehold soft-deletes household and provisions personal residence for owner');

      const deletedH = await prisma.household.findUnique({ where: { id: testHousehold.id } });
      assert(deletedH?.softDelete === true, 'Deleted household is marked softDelete: true in database');
    }

    // 9. Test deleteAccount
    {
      const req: any = {
        user: { userId: memberUser.id, householdId: memberUser.householdId, role: 'OWNER' }
      };
      const res = createMockRes();
      await authController.deleteAccount(req, res);
      assert(res.statusCode === 200 && res.jsonData?.success === true, 'deleteAccount deactivates user account and purges sensitive credentials');

      const deletedU = await prisma.user.findUnique({ where: { id: memberUser.id } });
      assert(deletedU?.softDelete === true && deletedU?.isActive === false && deletedU?.email === null, 'Deleted user has softDelete=true, isActive=false, email=null');
    }

    // Cleanup owner user
    await prisma.user.delete({ where: { id: ownerUser.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: memberUser.id } }).catch(() => {});

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n==================================================`);
  console.log(`SETTINGS FUNCTIONAL AUDIT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSettingsFunctionalAudit()
  .catch((e) => {
    console.error('Unhandled test failure:', e);
    process.exit(1);
  });
