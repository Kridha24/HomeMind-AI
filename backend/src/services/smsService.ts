import crypto from 'crypto';
import twilio from 'twilio';

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
 * Generates a cryptographically secure random 6-digit numeric OTP
 */
export function generateCryptographicOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Dispatches real SMS message to user's mobile number via Fast2SMS or Twilio API
 */
export async function sendMobileSMS(phoneNumber: string, otpCode: string): Promise<{ success: boolean; provider: string; message?: string }> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const tenDigitPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

  // 1. Try Fast2SMS (Best for Indian +91 Mobile Numbers)
  if (fast2smsKey) {
    try {
      const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsKey)}&variables_values=${otpCode}&route=otp&numbers=${tenDigitPhone}`;
      const response = await fetch(fast2smsUrl, {
        method: 'GET',
        headers: {
          'cache-control': 'no-cache',
        },
      });
      const data = await response.json();
      if (data.return === true) {
        console.log(`📱 [FAST2SMS SUCCESS] Real SMS OTP ${otpCode} delivered to ${phoneNumber}`);
        return { success: true, provider: 'FAST2SMS', message: 'SMS delivered to phone' };
      } else {
        console.warn(`⚠️ [FAST2SMS ERROR]`, data.message || data);
      }
    } catch (err: any) {
      console.error(`❌ [FAST2SMS DISPATCH ERROR]:`, err.message);
    }
  }

  // 2. Try Twilio (International SMS)
  if (twilioClient && twilioFrom) {
    try {
      const formattedTo = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const message = await twilioClient.messages.create({
        body: `[HomeMind AI] Your mobile verification code is: ${otpCode}. Valid for 5 minutes.`,
        from: twilioFrom,
        to: formattedTo,
      });
      console.log(`📱 [TWILIO SUCCESS] Real SMS dispatched to ${formattedTo} (SID: ${message.sid})`);
      return { success: true, provider: 'TWILIO', message: 'SMS delivered via Twilio' };
    } catch (err: any) {
      console.error(`❌ [TWILIO DISPATCH ERROR]:`, err.message);
    }
  }

  // 3. Dev Fallback Simulation
  console.log(`=======================================================`);
  console.log(`📱 [SMS OTP DISPATCHED TO ${phoneNumber}]: ${otpCode}`);
  console.log(`=======================================================`);
  return { success: true, provider: 'SERVER_DEV_SIMULATOR', message: 'OTP generated and logged' };
}
