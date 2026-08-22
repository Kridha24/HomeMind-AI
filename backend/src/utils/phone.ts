/**
 * Normalise an Indian-first phone number to E.164 (+91XXXXXXXXXX).
 * Accepts 9876543210, 919876543210, +91 98765 43210, etc.
 */
export function normalizePhone(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length < 10) return null;

  const ten = digits.slice(-10);
  if (!/^[6-9]\d{9}$/.test(ten)) {
    // Still accept 10-digit numbers that are not mobile-range (tests / other regions)
    if (ten.length !== 10) return null;
  }

  if (trimmed.startsWith('+') && digits.length > 10) {
    return `+${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return `+${digits}`;
}

export function phoneLookupVariants(e164: string): string[] {
  const digits = e164.replace(/[^0-9]/g, '');
  const ten = digits.slice(-10);
  const unique = new Set([e164, `+91${ten}`, `91${ten}`, ten, `+${digits}`]);
  return [...unique];
}
