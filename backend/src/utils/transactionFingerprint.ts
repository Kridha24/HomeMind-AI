import crypto from 'crypto';

export interface FingerprintInput {
  sender?: string;
  amount: number;
  type: string;
  reference?: string;
  accountLast4?: string;
  occurredAt: Date | string;
}

/**
 * Generates a deterministic SHA-256 fingerprint for financial SMS transactions.
 * Prevents duplicate database entries even if the Android app re-scans identical SMS.
 */
export function generateTransactionFingerprint(input: FingerprintInput): string {
  const normalizedSender = (input.sender || 'UNKNOWN').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normalizedAmount = Number(input.amount).toFixed(2);
  const normalizedType = input.type.trim().toUpperCase();
  const normalizedAccount = (input.accountLast4 || '').trim().replace(/[^0-9]/g, '');
  const ref = (input.reference || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  let datePart: string;
  const parsedDate = new Date(input.occurredAt);
  if (isNaN(parsedDate.getTime())) {
    datePart = 'INVALID_DATE';
  } else if (ref.length >= 4) {
    // When reference number is present and reliable, use full date (YYYY-MM-DD)
    datePart = parsedDate.toISOString().split('T')[0];
  } else {
    // When reference is missing, bucket timestamp to a 5-minute window to absorb minor clock variances
    const roundedTimestamp = Math.floor(parsedDate.getTime() / (5 * 60 * 1000));
    datePart = `B_${roundedTimestamp}`;
  }

  const rawFingerprint = [
    normalizedSender,
    normalizedAmount,
    normalizedType,
    ref,
    normalizedAccount,
    datePart
  ].join('|');

  return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
}
