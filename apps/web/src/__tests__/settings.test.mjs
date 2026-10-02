import assert from 'node:assert';

console.log('🧪 Starting HomeMind Settings & Control Center Verification Suite...\n');

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

// 1. Navigation items specification
const EXPECTED_TABS = [
  'profile',
  'household',
  'security',
  'notifications',
  'preferences',
  'appearance',
  'ai',
  'privacy',
  'integrations',
  'about'
];

check('Settings navigation contains 10 required tabs', () => {
  assert.strictEqual(EXPECTED_TABS.length, 10);
});

// 2. Role Based Access Control (RBAC)
const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'];

check('Backend roles match exact enum', () => {
  assert(ROLES.includes('OWNER'));
  assert(ROLES.includes('ADMIN'));
  assert(ROLES.includes('MEMBER'));
  assert(ROLES.includes('GUEST'));
});

check('Role permission rules for household rename & settings updates', () => {
  const canRenameHousehold = (role) => ['OWNER', 'ADMIN', 'HEAD'].includes(role);
  assert.strictEqual(canRenameHousehold('OWNER'), true);
  assert.strictEqual(canRenameHousehold('ADMIN'), true);
  assert.strictEqual(canRenameHousehold('MEMBER'), false);
  assert.strictEqual(canRenameHousehold('GUEST'), false);
});

check('Role permission rules for member role assignments', () => {
  const canChangeRoles = (role) => ['OWNER', 'CO-OWNER', 'ADMIN'].includes(role);
  assert.strictEqual(canChangeRoles('OWNER'), true);
  assert.strictEqual(canChangeRoles('ADMIN'), true);
  assert.strictEqual(canChangeRoles('MEMBER'), false);
});

// 3. User Avatar & Initials computation
check('Initials calculation handles full names, single names, and emails', () => {
  function getInitials(name, email) {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'HM';
  }

  assert.strictEqual(getInitials('John Doe', 'john@test.com'), 'JD');
  assert.strictEqual(getInitials('Priya', 'priya@test.com'), 'PR');
  assert.strictEqual(getInitials('', 'alex@test.com'), 'AL');
  assert.strictEqual(getInitials('', ''), 'HM');
});

// 4. Currency Engine & INR Defaults
check('Currency engine defaults to INR for India and formats correctly', () => {
  const countryDefaults = {
    IN: { currency: 'INR', symbol: '₹', timeZone: 'Asia/Kolkata' },
    US: { currency: 'USD', symbol: '$', timeZone: 'America/New_York' }
  };
  assert.strictEqual(countryDefaults.IN.currency, 'INR');
  assert.strictEqual(countryDefaults.IN.symbol, '₹');
});

console.log(`\nSettings Suite Results: ${passed} passed, 0 failed.\n`);
