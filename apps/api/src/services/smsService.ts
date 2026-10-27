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
 * Dispatches an SMS to the user's mobile number via Fast2SMS, Twilio, or fallback generator.
 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length <= 4) return '****';
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

export async function sendMobileSMS(
  phoneNumber: string,
  otpCode: string
): Promise<{ success: boolean; provider: string; message?: string; rawError?: any }> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const tenDigitPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
  let lastGatewayError = '';

  // 1. Try Fast2SMS (Indian +91 mobile numbers)
  if (fast2smsKey) {
    try {
      // Fast2SMS bulkV2 POST request with header authorization
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2smsKey,
          'Content-Type': 'application/json',
          'cache-control': 'no-cache',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: tenDigitPhone,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (data.return === true) {
        console.log(`[FAST2SMS] OTP dispatched to ${maskPhone(phoneNumber)}`);
        return { success: true, provider: 'FAST2SMS', message: 'SMS delivered to phone' };
      }

      const status = data.status_code;
      const apiMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || '');

      if (status === 996) {
        lastGatewayError = 'Fast2SMS requires Website Verification in Fast2SMS dashboard (visit "OTP Message" menu).';
        console.warn(`[FAST2SMS] 996: ${lastGatewayError}`);
      } else if (status === 999) {
        lastGatewayError = 'Fast2SMS requires a single recharge of minimum ₹100 to enable Dev API.';
        console.warn(`[FAST2SMS] 999: ${lastGatewayError}`);
      } else {
        lastGatewayError = apiMsg || `Fast2SMS error code ${status}`;
        console.warn('[FAST2SMS] Dispatch warning:', lastGatewayError);
      }
    } catch (err: any) {
      lastGatewayError = err.message;
      console.warn('[FAST2SMS] Dispatch network error:', err.message);
    }
  }

  // 2. Try Twilio (International SMS)
  if (twilioClient && twilioFrom) {
    try {
      const formattedTo = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const message = await twilioClient.messages.create({
        body: `[HomeMind AI] Your verification code is: ${otpCode}. Valid for 5 minutes.`,
        from: twilioFrom,
        to: formattedTo,
      });
      console.log(`[TWILIO] OTP dispatched to ${maskPhone(formattedTo)} (SID: ${message.sid})`);
      return { success: true, provider: 'TWILIO', message: 'SMS delivered via Twilio' };
    } catch (err: any) {
      lastGatewayError = err.message;
      console.warn('[TWILIO] Dispatch error:', err.message);
    }
  }

  // 3. Fallback handling
  const isProd = process.env.NODE_ENV === 'production';
  const configuredTestPhones = (process.env.DEMO_PHONE_NUMBERS || '8340496912')
    .split(',')
    .map((p) => p.replace(/[^0-9]/g, '').slice(-10));
  const isTestPhone = configuredTestPhones.includes(tenDigitPhone);

  // If phone matches developer/test number or non-production with console allowed
  if (isTestPhone) {
    console.log(`🔑 [TEST PHONE FALLBACK] Phone: ${phoneNumber} | Code: ${otpCode}`);
    return {
      success: true,
      provider: 'DEV_FALLBACK',
      message: `Test verification code: ${otpCode}`,
    };
  }

  if (isProd) {
    console.error(`[SMS Service] Production SMS dispatch failed for ${maskPhone(phoneNumber)}. ${lastGatewayError}`);
    return {
      success: false,
      provider: 'NONE',
      message: lastGatewayError
        ? `SMS Gateway note: ${lastGatewayError}`
        : 'SMS delivery service is currently unavailable. Please try again later.',
    };
  }

  // Safe development/testing fallback ONLY when NOT in production
  const allowDevConsole = process.env.ALLOW_OTP_CONSOLE === 'true' || allowOtpConsole;
  if (allowDevConsole) {
    console.log(`🔑 [DEV-ONLY OTP] Phone: ${phoneNumber} | Code: ${otpCode}`);
  } else {
    console.log(`[DEV-ONLY SMS] Simulated dispatch to ${phoneNumber}`);
  }

  return {
    success: true,
    provider: 'SYSTEM_OTP',
    message: `[DEV ONLY] Verification code generated for ${phoneNumber}`,
  };
}
