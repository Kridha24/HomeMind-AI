import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = port === 465;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 6000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      });
      console.log(`📧 [EMAIL SERVICE] Configured SMTP Transport via ${host}:${port} for ${user}`);
    } else {
      console.log(`⚠️ [EMAIL SERVICE] SMTP_USER and SMTP_PASS not set in backend/.env. Emails will be logged to console.`);
    }
  }

  async sendOTP(toEmail: string, otp: string, userName?: string): Promise<{ success: boolean; messageId?: string }> {
    const sender = process.env.SMTP_FROM || process.env.SMTP_USER || 'HomeMind AI <noreply@homemind.ai>';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HomeMind AI Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <div style="max-width: 500px; margin: 30px auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">HomeMind AI</h1>
      <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">Intelligent Household Management System</p>
    </div>

    <!-- Content -->
    <div style="padding: 35px 30px; text-align: center;">
      <h2 style="margin: 0 0 10px 0; color: #ffffff; font-size: 20px; font-weight: 700;">Your Verification Code</h2>
      <p style="margin: 0 0 25px 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
        ${userName ? `Hello <strong>${userName}</strong>, use` : 'Use'} the 6-digit verification code below to log in to your HomeMind AI account.
      </p>

      <!-- OTP Box -->
      <div style="background-color: #0f172a; border: 2px dashed #3b82f6; border-radius: 14px; padding: 18px 24px; display: inline-block; margin: 0 auto 25px auto;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #60a5fa;">${otp}</span>
      </div>

      <p style="margin: 0 0 15px 0; color: #cbd5e1; font-size: 13px;">
        ⏳ This code is valid for <strong>10 minutes</strong>.
      </p>
      <p style="margin: 0; color: #64748b; font-size: 12px;">
        If you did not request this verification code, please ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
      <p style="margin: 0; color: #475569; font-size: 11px;">
        🔒 Secure End-to-End Enterprise Household Isolation • HomeMind AI OS
      </p>
    </div>
  </div>
</body>
</html>
    `;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: sender,
          to: toEmail,
          subject: `🔐 ${otp} is your HomeMind AI Verification Code`,
          text: `Your HomeMind AI verification code is ${otp}. Valid for 10 minutes.`,
          html: htmlContent,
        });
        console.log(`📧 [EMAIL SENT SUCCESSFULLY] MessageId: ${info.messageId} to ${toEmail}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        console.error(`❌ [EMAIL SEND ERROR] Failed to send email via SMTP to ${toEmail}:`, err.message);
        return { success: false };
      }
    } else {
      console.log(`📧 [DEV EMAIL SIMULATION] To: ${toEmail} | Code: ${otp}`);
      return { success: true };
    }
  }
}

export const emailService = new EmailService();
