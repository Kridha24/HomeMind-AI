import { verifyGoogleIdToken, GoogleAuthError } from '../services/googleAuthService';
import { config } from '../config';

async function runGoogleAuthTests() {
  console.log('🧪 Starting HomeMind.AI Google OAuth Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  };

  // 1. Missing Token Check
  try {
    await verifyGoogleIdToken('');
    assert(false, 'Empty token must be rejected');
  } catch (err: any) {
    assert(err instanceof GoogleAuthError, 'Rejects empty token with GoogleAuthError');
    assert(err.code === 'GOOGLE_CREDENTIAL_MISSING', 'Code is GOOGLE_CREDENTIAL_MISSING');
  }

  // 2. Invalid Token Check
  try {
    await verifyGoogleIdToken('invalid.jwt.token');
    assert(false, 'Malformed JWT must be rejected');
  } catch (err: any) {
    assert(err instanceof GoogleAuthError, 'Rejects malformed token with GoogleAuthError');
    assert(err.code === 'GOOGLE_TOKEN_INVALID', 'Code is GOOGLE_TOKEN_INVALID');
  }

  // 3. Audience Config Consistency
  assert(Boolean(config.googleClientId), 'config.googleClientId is populated');
  assert(config.googleClientId.includes('apps.googleusercontent.com'), 'config.googleClientId has valid format');

  console.log(`\nGoogle Auth Test Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runGoogleAuthTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
