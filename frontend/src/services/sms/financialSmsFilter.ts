const REJECT_PATTERNS = [
  /\b(otp|one\s*time\s*password|verification\s*code|secret\s*code|security\s*code|login\s*code|auth\s*code)\b/i,
  /\b(do\s*not\s*share|never\s*share|valid\s*for\s*\d+\s*min)\b/i,
  /\b(pre-?approved|apply\s*now|claim\s*your|congratulations|lucky\s*draw|win\s*cash|discount\s*coupon)\b/i,
  /\b(loan\s*offer|credit\s*card\s*offer|instant\s*loan|personal\s*loan)\b/i
];

const DEBIT_KEYWORDS = [
  'debited', 'debit', 'spent', 'paid', 'withdrawn', 'purchase', 'deducted', 'sent to', 'transferred to', 'txn'
];

const CREDIT_KEYWORDS = [
  'credited', 'credit', 'received', 'deposited', 'refund', 'added to', 'salary', 'cashback received'
];

const FINANCIAL_INDICATORS = [
  'a/c', 'acct', 'account', 'vpa', 'upi', 'imps', 'neft', 'rtgs', 'atm', 'pos', 'card',
  'inr', 'rs', 'rs.', '₹', 'ref no', 'reference', 'avl bal', 'balance', 'txn'
];

export class FinancialSmsFilter {
  /**
   * Fast pre-filtering to decide if a message is a real financial transaction
   */
  static isFinancial(sender: string | null | undefined, body: string | null | undefined): boolean {
    if (!body || body.trim() === '') return false;

    if (sender) {
      const upperSender = sender.toUpperCase();
      if (upperSender.includes('PROMO') || upperSender.includes('OFFER')) return false;
    }

    const lowerBody = body.toLowerCase();

    // 1. Instantly reject OTP and spam
    for (const pattern of REJECT_PATTERNS) {
      if (pattern.test(lowerBody)) {
        return false;
      }
    }

    // 2. Must contain an amount / currency indicator
    const hasCurrency = lowerBody.includes('rs') || lowerBody.includes('inr') || lowerBody.includes('₹');
    if (!hasCurrency) return false;

    // 3. Must have a debit or credit action
    const hasDebit = DEBIT_KEYWORDS.some(k => lowerBody.includes(k));
    const hasCredit = CREDIT_KEYWORDS.some(k => lowerBody.includes(k));
    if (!hasDebit && !hasCredit) return false;

    // 4. Must contain an account or banking indicator
    return FINANCIAL_INDICATORS.some(k => lowerBody.includes(k));
  }

  /**
   * Financial confidence score between 0.0 and 1.0
   */
  static calculateFilterScore(sender: string | null | undefined, body: string | null | undefined): number {
    if (!this.isFinancial(sender, body)) return 0.0;

    let score = 0.40;
    const lowerBody = body!.toLowerCase();

    if (DEBIT_KEYWORDS.some(k => lowerBody.includes(k)) || CREDIT_KEYWORDS.some(k => lowerBody.includes(k))) {
      score += 0.20;
    }
    if (lowerBody.includes('ref') || lowerBody.includes('txn') || lowerBody.includes('rrn')) {
      score += 0.15;
    }
    if (lowerBody.includes('a/c') || lowerBody.includes('acct') || lowerBody.includes('account') || lowerBody.includes('card')) {
      score += 0.15;
    }
    if (sender && this.isFinancialSender(sender)) {
      score += 0.10;
    }

    return Math.min(1.0, score);
  }

  private static isFinancialSender(sender: string): boolean {
    const clean = sender.toUpperCase();
    const bankSenders = [
      'HDFC', 'SBI', 'ICICI', 'AXIS', 'KOTAK', 'BOB', 'PNB', 'CANARA',
      'UNIONB', 'YESB', 'IDFC', 'INDUS', 'PAYTM', 'FEDRL', 'SCB', 'CITI'
    ];
    return bankSenders.some(b => clean.includes(b));
  }
}
