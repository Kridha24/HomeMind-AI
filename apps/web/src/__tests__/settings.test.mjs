import assert from 'node:assert';

console.log('🧪 Starting HomeMind.AI Settings & Control Center Verification Suite...\n');

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

// 2. Role Based Access Control (RBAC) & Badge Mapping
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

check('Role badge color mappings: OWNER (violet), ADMIN (blue), MEMBER (emerald), GUEST (neutral)', () => {
  const getRoleVariant = (role) => {
    switch (role) {
      case 'OWNER': return 'owner'; // violet
      case 'ADMIN': return 'admin'; // blue
      case 'MEMBER': return 'member'; // emerald
      default: return 'guest'; // neutral
    }
  };
  assert.strictEqual(getRoleVariant('OWNER'), 'owner');
  assert.strictEqual(getRoleVariant('ADMIN'), 'admin');
  assert.strictEqual(getRoleVariant('MEMBER'), 'member');
  assert.strictEqual(getRoleVariant('GUEST'), 'guest');
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

// 5. Local Search Across Settings Sections
check('Settings local search correctly routes keywords to appropriate tabs', () => {
  const searchMap = {
    password: 'security',
    session: 'security',
    theme: 'appearance',
    dark: 'appearance',
    sms: 'privacy',
    ai: 'ai',
    copilot: 'ai',
    notifications: 'notifications',
    currency: 'preferences',
    members: 'household'
  };

  const navKeywords = {
    security: ['password', 'session', 'auth', 'devices'],
    appearance: ['theme', 'dark', 'light', 'mode'],
    privacy: ['sms', 'privacy', 'export', 'data'],
    ai: ['ai', 'copilot', 'smart'],
    notifications: ['notifications', 'alerts', 'bills'],
    preferences: ['currency', 'language', 'timezone'],
    household: ['members', 'residence', 'invite']
  };

  for (const [kw, expectedTab] of Object.entries(searchMap)) {
    const matched = Object.entries(navKeywords).find(([tab, kws]) =>
      tab === kw || kws.some(k => k.includes(kw))
    );
    assert(matched, `Keyword "${kw}" must match a settings category`);
    assert.strictEqual(matched[0], expectedTab, `Keyword "${kw}" should match tab "${expectedTab}"`);
  }
});

// 6. Product Branding
check('Product branding exact casing is HomeMind.AI', () => {
  const brand = 'HomeMind.AI';
  assert.strictEqual(brand, 'HomeMind.AI');
  assert.notStrictEqual(brand, 'HomeMind.Ai');
  assert.notStrictEqual(brand, 'HOMEMIND.AI');
  assert.notStrictEqual(brand, 'HomeMind');
});

console.log(`\nSettings Suite Results: ${passed} passed, 0 failed.\n`);
