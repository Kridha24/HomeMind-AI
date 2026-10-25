import path from 'path';
import { LocalStorageProvider } from '../infrastructure/storage/objectStorageService';
import { getThreadMessages } from '../controllers/assistantController';
import { deleteAccount } from '../controllers/authController';
import { prisma } from '../repositories/db';

// Ensure isolated testing
async function runRemediationSecurityTests() {
  console.log('🧪 Starting Security Audit Remediation Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // 1. Path Traversal Hardening Test (LocalStorageProvider)
  // -------------------------------------------------------------------------
  const storage = new LocalStorageProvider('./test-uploads');
  
  // Safe keys should resolve inside baseDir
  let safeResolved = false;
  try {
    const p = storage.getFilePath('attachments/receipt-123.pdf');
    safeResolved = p.includes('attachments') && !p.includes('..');
  } catch (err) {
    safeResolved = false;
  }
  assert('Path Traversal: Legitimate relative keys are permitted', safeResolved);

  // Directory traversal attacks must throw error
  const dangerousKeys = [
    '../../etc/passwd',
    '../../../var/log/system.log',
    'attachments/../../secrets.env',
    '..\\..\\windows\\win.ini',
  ];

  for (const dangerousKey of dangerousKeys) {
    let blocked = false;
    try {
      storage.getFilePath(dangerousKey);
    } catch (err: any) {
      if (err.message && err.message.includes('path traversal')) {
        blocked = true;
      }
    }
    assert(`Path Traversal: Blocked malicious key '${dangerousKey}'`, blocked);
  }

  // -------------------------------------------------------------------------
  // 2. Cross-Household AI Thread Tenant Isolation (IDOR)
  // -------------------------------------------------------------------------
  const originalFindFirst = (prisma.aIThread as any).findFirst;
  const originalFindMany = (prisma.aIMessage as any).findMany;

  try {
    // Household A user attempting to read Household B's thread
    (prisma.aIThread as any).findFirst = async ({ where }: any) => {
      if (where.id === 'thread-household-b' && where.householdId === 'household-a') {
        return null; // Household A doesn't own this thread
      }
      if (where.id === 'thread-household-a' && where.householdId === 'household-a') {
        return { id: 'thread-household-a', householdId: 'household-a' };
      }
      return null;
    };

    (prisma.aIMessage as any).findMany = async () => [
      { id: 'msg-1', content: 'Secret household conversation' },
    ];

    // Mock Req & Res for unauthorized attempt
    const mockReqB: any = {
      params: { threadId: 'thread-household-b' },
      user: { userId: 'user-a', householdId: 'household-a' },
    };

    let statusB = 0;
    let jsonB: any = null;
    const mockResB: any = {
      status: (code: number) => {
        statusB = code;
        return mockResB;
      },
      json: (data: any) => {
        jsonB = data;
        return mockResB;
      },
    };

    await getThreadMessages(mockReqB, mockResB);
    assert(
      'IDOR Protection: Cross-household thread access is rejected with 404',
      statusB === 404 && jsonB?.error === 'Thread not found'
    );

    // Mock Req & Res for legitimate access
    const mockReqA: any = {
      params: { threadId: 'thread-household-a' },
      user: { userId: 'user-a', householdId: 'household-a' },
    };

    let statusA = 0;
    let jsonA: any = null;
    const mockResA: any = {
      status: (code: number) => {
        statusA = code;
        return mockResA;
      },
      json: (data: any) => {
        jsonA = data;
        return mockResA;
      },
    };

    await getThreadMessages(mockReqA, mockResA);
    assert(
      'Tenant Isolation: Authorized household member successfully retrieves thread messages',
      Array.isArray(jsonA?.messages) && jsonA.messages.length === 1
    );
  } finally {
    (prisma.aIThread as any).findFirst = originalFindFirst;
    (prisma.aIMessage as any).findMany = originalFindMany;
  }

  // -------------------------------------------------------------------------
  // 3. Account Deletion: Device Token & E2EE Key Revocation
  // -------------------------------------------------------------------------
  const origUserFindUnique = (prisma.user as any).findUnique;
  const origUserUpdate = (prisma.user as any).update;
  const origTokenDeleteMany = (prisma.refreshToken as any).deleteMany;
  const origDeviceUpdateMany = (prisma.deviceRegistration as any).updateMany;
  const origKeyUpdateMany = (prisma.deviceKey as any).updateMany;
  const origMemoryDeleteMany = (prisma.aIMemory as any).deleteMany;
  const origAuditLogCreate = (prisma.auditLog as any).create;

  let deviceTokensDeactivated = false;
  let deviceKeysRevoked = false;
  let refreshTokensDeleted = false;
  let personalMemoriesDeleted = false;
  let userSoftDeleted = false;
  let auditLogCreated = false;

  try {
    (prisma.user as any).findUnique = async () => ({
      id: 'target-user-123',
      householdId: 'household-xyz',
      role: 'MEMBER',
    });

    (prisma.refreshToken as any).deleteMany = async ({ where }: any) => {
      if (where.userId === 'target-user-123') refreshTokensDeleted = true;
      return { count: 2 };
    };

    (prisma.deviceRegistration as any).updateMany = async ({ where, data }: any) => {
      if (where.userId === 'target-user-123' && data.isActive === false) {
        deviceTokensDeactivated = true;
      }
      return { count: 1 };
    };

    (prisma.deviceKey as any).updateMany = async ({ where, data }: any) => {
      if (where.userId === 'target-user-123' && data.revokedAt instanceof Date) {
        deviceKeysRevoked = true;
      }
      return { count: 1 };
    };

    (prisma.aIMemory as any).deleteMany = async ({ where }: any) => {
      if (where.userId === 'target-user-123') personalMemoriesDeleted = true;
      return { count: 5 };
    };

    (prisma.auditLog as any).create = async () => {
      auditLogCreated = true;
      return { id: 'audit-log-1' };
    };

    (prisma.user as any).update = async ({ where, data }: any) => {
      if (where.id === 'target-user-123' && data.softDelete === true && data.name === 'Deleted User') {
        userSoftDeleted = true;
      }
      return { id: 'target-user-123' };
    };

    const mockDelReq: any = {
      user: { userId: 'target-user-123', householdId: 'household-xyz' },
    };
    let delResStatus = 0;
    const mockDelRes: any = {
      status: (s: number) => {
        delResStatus = s;
        return mockDelRes;
      },
      json: () => mockDelRes,
    };

    await deleteAccount(mockDelReq, mockDelRes);

    assert('Account Erasure: Push device registration tokens deactivated', deviceTokensDeactivated);
    assert('Account Erasure: E2EE cryptographic identity keys revoked', deviceKeysRevoked);
    assert('Account Erasure: Active refresh sessions deleted', refreshTokensDeleted);
    assert('Account Erasure: Personal AI memory profile wiped', personalMemoriesDeleted);
    assert('Account Erasure: User record anonymized and soft-deleted', userSoftDeleted);
  } finally {
    (prisma.user as any).findUnique = origUserFindUnique;
    (prisma.user as any).update = origUserUpdate;
    (prisma.refreshToken as any).deleteMany = origTokenDeleteMany;
    (prisma.deviceRegistration as any).updateMany = origDeviceUpdateMany;
    (prisma.deviceKey as any).updateMany = origKeyUpdateMany;
    (prisma.aIMemory as any).deleteMany = origMemoryDeleteMany;
    (prisma.auditLog as any).create = origAuditLogCreate;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runRemediationSecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
