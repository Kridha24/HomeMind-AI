export class FinancialSmsFilter {
  // Common non-transaction OTP phrases (logins, password resets)
  private static NON_FINANCIAL_OTP_PATTERNS = [
    /login otp/i,
    /verification code/i,
    /verify your (account|email|device|phone)/i,
    /password reset/i,
    /security code/i,
    /one-time password to log in/i,
  ];

  // Financial action indicators
  private static FINANCIAL_ACTION_PATTERNS = [
    /\b(debited|debited by|debited for)\b/i,
    /\b(credited|credited with|credited to)\b/i,
    /\b(paid|paid to|sent|sent to|spent|withdrawn|transferred|transferred to)\b/i,
    /\b(received|received from|refunded|cashback received)\b/i,
    /\b(txn of|transaction of|vpa)\b/i,
  ];


  // Currency indicators
  private static CURRENCY_PATTERNS = [
    /(?:rs\.?|inr|₹)\s*[\d,]+(?:\.\d{1,2})?/i,
    /[\d,]+(?:\.\d{1,2})?\s*(?:inr|rs\.?|₹)/i,
  ];

  /**
   * Determine if an SMS is an approved financial transaction message.
   * Privacy Rule: Never collect personal conversations or generic login OTPs.
   */
  public static isFinancial(sender: string = '', body: string = ''): boolean {
    const cleanBody = body.trim();
    const cleanSender = sender.trim().toUpperCase();

    if (!cleanBody || cleanBody.length < 15) {
      return false;
    }

    // 1. Filter out pure non-financial authentication OTPs
    for (const pattern of this.NON_FINANCIAL_OTP_PATTERNS) {
      if (pattern.test(cleanBody)) {
        // If it also explicitly mentions a debit/credit of money, it could be a transaction OTP, but we prefer parsed settled transactions
        if (!/\b(debited|credited|spent)\b/i.test(cleanBody)) {
          return false;
        }
      }
    }

    // 2. Reject pure marketing SMS without financial debit/credit action
    const hasFinancialAction = this.FINANCIAL_ACTION_PATTERNS.some((p) => p.test(cleanBody));
    if (!hasFinancialAction) {
      return false;
    }

    // 3. Must contain currency or amount
    const hasCurrency = this.CURRENCY_PATTERNS.some((p) => p.test(cleanBody));
    if (!hasCurrency) {
      return false;
    }

    return true;
  }
}
