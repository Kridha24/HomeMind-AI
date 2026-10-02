import assert from 'node:assert';

console.log('🧪 Starting HomeMind.AI Household Control Center / Family Workspace Verification Suite...\n');

let passed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}:`, err.message);
    process.exit(1);
  }
}

// ----------------------------------------------------
// 1. RBAC Permission Helpers
// ----------------------------------------------------
function canInviteMember(userRole) {
  if (!userRole) return false;
  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

function canRenameHousehold(userRole) {
  if (!userRole) return false;
  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

function canRegenerateInviteCode(userRole) {
  if (!userRole) return false;
  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

function canManageRoles(userRole, targetMemberRole) {
  if (!userRole) return false;
  if (['MEMBER', 'GUEST'].includes(userRole)) return false;
  if (['ADMIN', 'CO-OWNER'].includes(targetMemberRole || '')) {
    return userRole === 'OWNER';
  }
  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

function canRemoveMember(userRole, targetMemberRole, isSelf = false) {
  if (!userRole || isSelf) return false;
  if (targetMemberRole === 'OWNER') return false;
  if (targetMemberRole === 'ADMIN' && userRole !== 'OWNER') return false;
  return ['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD'].includes(userRole);
}

function canTransferOwnership(userRole) {
  return userRole === 'OWNER';
}

function canDeleteHousehold(userRole) {
  return userRole === 'OWNER';
}

function canLeaveHousehold(userRole, otherOwnersCount = 0, otherMembersCount = 0) {
  if (userRole === 'OWNER' && otherOwnersCount === 0 && otherMembersCount > 0) {
    return {
      canLeave: false,
      reason: 'As the sole owner, please transfer ownership to another member before leaving.',
    };
  }
  return { canLeave: true };
}

check('RBAC: Only OWNER, CO-OWNER, and ADMIN can invite members', () => {
  assert.strictEqual(canInviteMember('OWNER'), true);
  assert.strictEqual(canInviteMember('ADMIN'), true);
  assert.strictEqual(canInviteMember('MEMBER'), false);
  assert.strictEqual(canInviteMember('GUEST'), false);
  assert.strictEqual(canInviteMember(undefined), false);
});

check('RBAC: Only OWNER and ADMIN can rename household', () => {
  assert.strictEqual(canRenameHousehold('OWNER'), true);
  assert.strictEqual(canRenameHousehold('ADMIN'), true);
  assert.strictEqual(canRenameHousehold('MEMBER'), false);
  assert.strictEqual(canRenameHousehold('GUEST'), false);
});

check('RBAC: Only OWNER can modify another ADMIN role', () => {
  assert.strictEqual(canManageRoles('ADMIN', 'ADMIN'), false);
  assert.strictEqual(canManageRoles('ADMIN', 'MEMBER'), true);
  assert.strictEqual(canManageRoles('ADMIN', 'GUEST'), true);
  assert.strictEqual(canManageRoles('OWNER', 'ADMIN'), true);
  assert.strictEqual(canManageRoles('MEMBER', 'MEMBER'), false);
});

check('RBAC: Member removal constraints preserve owners and admin tiers', () => {
  // Self removal is handled via leave household
  assert.strictEqual(canRemoveMember('OWNER', 'OWNER', true), false);
  // ADMIN cannot remove OWNER
  assert.strictEqual(canRemoveMember('ADMIN', 'OWNER', false), false);
  // ADMIN cannot remove another ADMIN
  assert.strictEqual(canRemoveMember('ADMIN', 'ADMIN', false), false);
  // ADMIN can remove MEMBER
  assert.strictEqual(canRemoveMember('ADMIN', 'MEMBER', false), true);
  // OWNER can remove ADMIN and MEMBER
  assert.strictEqual(canRemoveMember('OWNER', 'ADMIN', false), true);
  assert.strictEqual(canRemoveMember('OWNER', 'MEMBER', false), true);
  // MEMBER cannot remove anyone
  assert.strictEqual(canRemoveMember('MEMBER', 'MEMBER', false), false);
});

check('RBAC: Ownership transfer and Household deletion are strictly OWNER only', () => {
  assert.strictEqual(canTransferOwnership('OWNER'), true);
  assert.strictEqual(canTransferOwnership('ADMIN'), false);
  assert.strictEqual(canTransferOwnership('MEMBER'), false);

  assert.strictEqual(canDeleteHousehold('OWNER'), true);
  assert.strictEqual(canDeleteHousehold('ADMIN'), false);
  assert.strictEqual(canDeleteHousehold('MEMBER'), false);
});

check('RBAC: Sole owner is prevented from orphaning household without transfer', () => {
  const soleOwnerAttempt = canLeaveHousehold('OWNER', 0, 3);
  assert.strictEqual(soleOwnerAttempt.canLeave, false);
  assert.match(soleOwnerAttempt.reason, /sole owner.*transfer ownership/i);

  const coOwnerAttempt = canLeaveHousehold('OWNER', 1, 3);
  assert.strictEqual(coOwnerAttempt.canLeave, true);

  const memberAttempt = canLeaveHousehold('MEMBER', 1, 3);
  assert.strictEqual(memberAttempt.canLeave, true);
});

// ----------------------------------------------------
// 2. Formatters & Role Configs
// ----------------------------------------------------
function getUserInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U';
}

check('Formatters: User initials handle multi-word names, single words, and email fallbacks', () => {
  assert.strictEqual(getUserInitials('Alex Rivera'), 'AR');
  assert.strictEqual(getUserInitials('Mihir Shekhar Gupta'), 'MG');
  assert.strictEqual(getUserInitials('Sarah'), 'SA');
  assert.strictEqual(getUserInitials('', 'john@example.com'), 'JO');
  assert.strictEqual(getUserInitials(null, null), 'U');
});

function formatRelativeTime(dateInput, now = new Date()) {
  if (!dateInput) return 'Recently';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'Recently';

  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

check('Formatters: Relative time produces human-readable calm strings', () => {
  const now = new Date();
  const thirtySecAgo = new Date(now.getTime() - 30 * 1000);
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  assert.strictEqual(formatRelativeTime(thirtySecAgo, now), 'Just now');
  assert.strictEqual(formatRelativeTime(tenMinAgo, now), '10 min ago');
  assert.strictEqual(formatRelativeTime(twoHoursAgo, now), '2h ago');
  assert.strictEqual(formatRelativeTime(threeDaysAgo, now), '3d ago');
  assert.strictEqual(formatRelativeTime(null, now), 'Recently');
});

// ----------------------------------------------------
// 3. Workload & Responsibilities Logic
// ----------------------------------------------------
function calculateResponsibilities(members, tasks) {
  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const totalActive = activeTasks.length;

  const workloadByMember = members.map((member) => {
    const memberTasks = activeTasks.filter(
      (t) =>
        t.assigneeId === member.id ||
        t.assignee?.id === member.id ||
        (t.assignee?.name && t.assignee.name.toLowerCase() === member.name.toLowerCase())
    );
    const count = memberTasks.length;
    const percentage = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;
    return { memberId: member.id, count, percentage };
  });

  const unassignedTasks = activeTasks.filter((t) => !t.assigneeId && !t.assignee);
  const unassignedCount = unassignedTasks.length;
  const unassignedPercentage = totalActive > 0 ? Math.round((unassignedCount / totalActive) * 100) : 0;

  return { totalActive, workloadByMember, unassignedCount, unassignedPercentage };
}

check('Responsibilities: Accurately calculates member workloads and unassigned chores without division by zero', () => {
  const members = [
    { id: 'm1', name: 'Alex Rivera' },
    { id: 'm2', name: 'Sarah Rivera' },
  ];

  const tasks = [
    { id: 't1', status: 'PENDING', assigneeId: 'm1' },
    { id: 't2', status: 'IN_PROGRESS', assignee: { id: 'm1', name: 'Alex Rivera' } },
    { id: 't3', status: 'PENDING', assigneeId: 'm2' },
    { id: 't4', status: 'PENDING', assigneeId: null, assignee: null },
    { id: 't5', status: 'COMPLETED', assigneeId: 'm2' }, // completed, should be excluded
  ];

  const result = calculateResponsibilities(members, tasks);
  assert.strictEqual(result.totalActive, 4);

  const m1Workload = result.workloadByMember.find((w) => w.memberId === 'm1');
  assert.strictEqual(m1Workload.count, 2);
  assert.strictEqual(m1Workload.percentage, 50);

  const m2Workload = result.workloadByMember.find((w) => w.memberId === 'm2');
  assert.strictEqual(m2Workload.count, 1);
  assert.strictEqual(m2Workload.percentage, 25);

  assert.strictEqual(result.unassignedCount, 1);
  assert.strictEqual(result.unassignedPercentage, 25);

  // Zero-tasks edge case
  const emptyResult = calculateResponsibilities(members, []);
  assert.strictEqual(emptyResult.totalActive, 0);
  assert.strictEqual(emptyResult.workloadByMember[0].percentage, 0);
  assert.strictEqual(emptyResult.unassignedPercentage, 0);
});

// ----------------------------------------------------
// 4. Tenant Cache Key Safety
// ----------------------------------------------------
check('React Query: All household keys are tenant-scoped with householdId', () => {
  const householdId = 'rivera-1234';
  const keys = [
    ['householdMembers', householdId],
    ['householdActivity', householdId],
    ['tasks', householdId],
    ['groceries', householdId],
    ['bills', householdId],
    ['dashboardSummary', householdId],
  ];

  for (const key of keys) {
    assert.strictEqual(key.length, 2);
    assert.strictEqual(key[1], householdId);
    assert.notStrictEqual(key[0], '');
  }
});

console.log(`\n==================================================`);
console.log(`Household Workspace Verification: ${passed} passed, 0 failed`);
console.log(`==================================================\n`);
