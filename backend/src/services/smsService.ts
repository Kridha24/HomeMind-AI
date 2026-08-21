import crypto from 'crypto';
import twilio from 'twilio';

const isProduction = process.env.NODE_ENV === 'production';
const allowOtpConsole = process.env.ALLOW_OTP_CONSOLE === 'true';

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
const fast2smsKey = process.env.FAST2SMS_API_KEY;

let twilioClient: twilio.Twilio | null = null;
if (twilioSid && twilioToken) {
  try {
    twilioClient = twilio(twilioSid, twilioToken);
    console.log('[SMS Service] Twilio SMS client initialized.');
  } catch (e) {
    console.warn('[SMS Service] Failed to initialize Twilio client:', e);
  }
}

/**
 * Generates a cryptographically secure random 6-digit numeric OTP.
 */
export function generateCryptographicOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Dispatches a real SMS to the user's mobile number via Fast2SMS or Twilio.
 *
 * In production: if all SMS providers fail, returns { success: false }.
 *   The caller must respond with 503 and must NOT claim the OTP was sent.
 *
 * In development: falls back to console logging only if ALLOW_OTP_CONSOLE=true.
 *   The OTP is never logged in production regardless of flags.
 */
export async function sendMobileSMS(
  phoneNumber: string,
  otpCode: string
): Promise<{ success: boolean; provider: string; message?: string }> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const tenDigitPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

  // 1. Try Fast2SMS (best for Indian +91 mobile numbers)
  if (fast2smsKey) {
    try {
      const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsKey)}&variables_values=${otpCode}&route=otp&numbers=${tenDigitPhone}`;
      const response = await fetch(fast2smsUrl, {
        method: 'GET',
        headers: { 'cache-control': 'no-cache' },
      });
      const data = await response.json();
      if (data.return === true) {
        console.log(`[FAST2SMS] OTP dispatched to ${phoneNumber}`);
        return { success: true, provider: 'FAST2SMS', message: 'SMS delivered to phone' };
      } else {
        console.warn('[FAST2SMS] Dispatch warning:', data.message || data);
      }
    } catch (err: any) {
      console.error('[FAST2SMS] Dispatch error:', err.message);
    }
  }

  // 2. Try Twilio (international SMS)
  if (twilioClient && twilioFrom) {
    try {
      const formattedTo = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const message = await twilioClient.messages.create({
        body: `[HomeMind AI] Your verification code is: ${otpCode}. Valid for 5 minutes.`,
        from: twilioFrom,
        to: formattedTo,
      });
      console.log(`[TWILIO] OTP dispatched to ${formattedTo} (SID: ${message.sid})`);
      return { success: true, provider: 'TWILIO', message: 'SMS delivered via Twilio' };
    } catch (err: any) {
      console.error('[TWILIO] Dispatch error:', err.message);
    }
  }

  // 3. Development console fallback — NEVER used in production.
  if (!isProduction) {
    if (allowOtpConsole) {
      console.log(`[DEV OTP] Phone: ${phoneNumber} | Code: ${otpCode}`);
    } else {
      console.log(`[DEV OTP] OTP dispatched to ${phoneNumber} (set ALLOW_OTP_CONSOLE=true to see code)`);
    }
    return { success: true, provider: 'DEV_CONSOLE', message: 'OTP logged to console (dev only)' };
  }

  // Production: all providers failed — do NOT simulate success.
  console.error(`[SMS] All SMS providers failed for ${phoneNumber}. OTP not delivered.`);
  return { success: false, provider: 'NONE', message: 'SMS delivery failed' };
}
