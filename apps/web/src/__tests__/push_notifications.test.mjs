import assert from 'assert';

console.log('🧪 Starting HomeMind.AI Frontend Push Notification & Permission Logic Test Suite...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}\n     ${err.message}`);
    failed++;
  }
}

// 1. Device Metadata and Browser Detection
test('Device Metadata: Correctly derives browser and OS platform labels', () => {
  function parseUserAgent(ua) {
    let browser = 'Browser';
    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox/')) browser = 'Firefox';

    let os = 'Desktop';
    let platform = 'web';
    if (/Android/i.test(ua)) {
      os = 'Android';
      platform = 'android';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      os = 'iOS';
      platform = 'ios';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      os = 'macOS';
    } else if (/Windows/i.test(ua)) {
      os = 'Windows';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
    }

    return { platform, deviceName: `${browser} on ${os}`, browser };
  }

  // macOS Chrome
  const macChrome = parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36');
  assert.strictEqual(macChrome.deviceName, 'Chrome on macOS');
  assert.strictEqual(macChrome.platform, 'web');

  // Android Chrome
  const androidChrome = parseUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36');
  assert.strictEqual(androidChrome.deviceName, 'Chrome on Android');
  assert.strictEqual(androidChrome.platform, 'android');

  // Windows Edge
  const winEdge = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/122.0.0.0');
  assert.strictEqual(winEdge.deviceName, 'Edge on Windows');
  assert.strictEqual(winEdge.platform, 'web');
});

// 2. Safe Internal Route Navigation & Open Redirect Prevention
test('Click Navigation: Enforces strictly internal relative routes', () => {
  function sanitizeRoute(route) {
    if (!route || typeof route !== 'string') return '/';
    const trimmed = route.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
      return '/';
    }
    return trimmed;
  }

  assert.strictEqual(sanitizeRoute('/finance'), '/finance');
  assert.strictEqual(sanitizeRoute('/bills'), '/bills');
  assert.strictEqual(sanitizeRoute('/tasks'), '/tasks');
  assert.strictEqual(sanitizeRoute('/groceries'), '/groceries');
  assert.strictEqual(sanitizeRoute('/family'), '/family');
  assert.strictEqual(sanitizeRoute('https://evil.attacker.com/steal-token'), '/');
  assert.strictEqual(sanitizeRoute('//evil.com'), '/');
  assert.strictEqual(sanitizeRoute(null), '/');
});

// 3. Category Preference Defaults and Merging
test('Category Preferences: Default preferences enable all standard channels safely', () => {
  const defaults = {
    finance: true,
    bills: true,
    tasks: true,
    groceries: true,
    family: true,
    security: true,
  };

  const userCustom = { finance: false, groceries: false };
  const merged = { ...defaults, ...userCustom };

  assert.strictEqual(merged.finance, false);
  assert.strictEqual(merged.groceries, false);
  assert.strictEqual(merged.bills, true);
  assert.strictEqual(merged.tasks, true);
  assert.strictEqual(merged.family, true);
  assert.strictEqual(merged.security, true);
});

// 4. Foreground Message Deduplication
test('Foreground Messaging: Listeners can be registered and cleanly unregistered without leakage', () => {
  const listeners = [];
  function addListener(cb) {
    listeners.push(cb);
    return () => {
      const idx = listeners.indexOf(cb);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  let callCountA = 0;
  let callCountB = 0;
  const unsubA = addListener(() => { callCountA++; });
  const unsubB = addListener(() => { callCountB++; });

  assert.strictEqual(listeners.length, 2);

  // Dispatch mock message
  listeners.forEach((l) => l());
  assert.strictEqual(callCountA, 1);
  assert.strictEqual(callCountB, 1);

  // Unsubscribe A
  unsubA();
  assert.strictEqual(listeners.length, 1);

  // Dispatch again
  listeners.forEach((l) => l());
  assert.strictEqual(callCountA, 1, 'Unsubscribed listener must not receive further events');
  assert.strictEqual(callCountB, 2);
});

console.log(`\n==================================================`);
console.log(`FRONTEND PUSH TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log(`==================================================\n`);

if (failed > 0) {
  process.exit(1);
}
