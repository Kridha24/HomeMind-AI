/**
 * Deterministic Merchant Categorizer
 * Maps well-known merchants, payment keywords, and categories.
 */

const MERCHANT_CATEGORY_MAP: Record<string, string> = {
  // Food & Dining
  ZOMATO: 'Food',
  SWIGGY: 'Food',
  MCDONALD: 'Food',
  DOMINO: 'Food',
  STARBUCKS: 'Food',
  KFC: 'Food',
  BURGERKING: 'Food',
  PIZZAHUT: 'Food',
  SUBWAY: 'Food',
  CHAAYOS: 'Food',
  CHAI: 'Food',
  EATS: 'Food',
  RESTAURANT: 'Food',
  CAFE: 'Food',
  BAKERY: 'Food',
  DUNKIN: 'Food',

  // Groceries & Daily Needs
  BLINKIT: 'Groceries',
  ZEPTO: 'Groceries',
  INSTAMART: 'Groceries',
  BIGBASKET: 'Groceries',
  DMART: 'Groceries',
  NATURESBASKET: 'Groceries',
  RELIANCEFRESH: 'Groceries',
  SPENCERS: 'Groceries',
  SUPERMARKET: 'Groceries',
  PROVISION: 'Groceries',
  KIRANA: 'Groceries',
  MILK: 'Groceries',
  VEGETABLES: 'Groceries',

  // Transport & Fuel
  UBER: 'Transport',
  OLA: 'Transport',
  RAPIDO: 'Transport',
  METRO: 'Transport',
  FASTAG: 'Transport',
  INDIANOIL: 'Transport',
  IOCL: 'Transport',
  HPCL: 'Transport',
  BPCL: 'Transport',
  PETROL: 'Transport',
  DIESEL: 'Transport',
  SHELL: 'Transport',
  IRCTC: 'Transport',
  MAKEMYTRIP: 'Transport',
  GOIBIBO: 'Transport',
  CLEARTRIP: 'Transport',
  INDIGO: 'Transport',
  AIRINDIA: 'Transport',
  PARKING: 'Transport',
  TOLL: 'Transport',

  // Shopping & E-Commerce
  AMAZON: 'Shopping',
  FLIPKART: 'Shopping',
  MYNTRA: 'Shopping',
  MEESHO: 'Shopping',
  AJIO: 'Shopping',
  NYKAA: 'Shopping',
  TATA1MG: 'Healthcare',
  TATACLIQ: 'Shopping',
  ZARA: 'Shopping',
  HNM: 'Shopping',
  LIFESTYLE: 'Shopping',
  SHOPPERSSTOP: 'Shopping',
  DECATHLON: 'Shopping',
  CROMA: 'Shopping',
  RELIANCEDIGITAL: 'Shopping',

  // Entertainment & Subscriptions
  NETFLIX: 'Entertainment',
  SPOTIFY: 'Entertainment',
  HOTSTAR: 'Entertainment',
  DISNEY: 'Entertainment',
  PRIMEVIDEO: 'Entertainment',
  YOUTUBE: 'Entertainment',
  BOOKMYSHOW: 'Entertainment',
  PVR: 'Entertainment',
  INOX: 'Entertainment',
  APPLE: 'Entertainment',
  GOOGLEPLAY: 'Entertainment',
  PLAYSTATION: 'Entertainment',
  STEAM: 'Entertainment',

  // Utilities & Bills
  AIRTEL: 'Bills',
  JIO: 'Bills',
  VODAFONE: 'Bills',
  VI: 'Bills',
  BESCOM: 'Bills',
  MSEDCL: 'Bills',
  TATAPOWER: 'Bills',
  ADANIPOWER: 'Bills',
  ELECTRICITY: 'Bills',
  WATERBOARD: 'Bills',
  IGL: 'Bills',
  MAHANAGAR: 'Bills',
  PIPEDGAS: 'Bills',
  BROADBAND: 'Bills',
  ACTFIBER: 'Bills',
  RECHARGE: 'Bills',

  // Healthcare & Medicine
  APOLLO: 'Healthcare',
  PHARMEASY: 'Healthcare',
  ONEMG: 'Healthcare',
  NETMEDS: 'Healthcare',
  MEDPLUS: 'Healthcare',
  HOSPITAL: 'Healthcare',
  CLINIC: 'Healthcare',
  DIAGNOSTICS: 'Healthcare',
  MAXHEALTHCARE: 'Healthcare',
  FORTIS: 'Healthcare',

  // Income / Cashbacks / Deposits
  SALARY: 'Salary',
  PAYROLL: 'Salary',
  DIVIDEND: 'Investment',
  INTEREST: 'Interest',
  CASHBACK: 'Cashback',
  REFUND: 'Refund',
};

export class TransactionCategorizer {
  /**
   * Deterministically infers category from merchant name or transaction text
   */
  static categorize(merchant?: string | null, paymentMethod?: string | null, type?: string | null): string {
    if (type === 'CREDIT') {
      if (merchant) {
        const upper = merchant.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (upper.includes('SALARY') || upper.includes('PAYROLL')) return 'Salary';
        if (upper.includes('REFUND')) return 'Refund';
        if (upper.includes('CASHBACK')) return 'Cashback';
        if (upper.includes('INTEREST')) return 'Interest';
        if (upper.includes('DIVIDEND')) return 'Investment';
      }
      return 'Income';
    }

    if (!merchant || merchant.trim() === '') {
      if (paymentMethod === 'ATM') return 'Cash Withdrawal';
      return 'Other';
    }

    const cleanMerchant = merchant.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 1. Direct or partial key match
    for (const [key, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
      if (cleanMerchant.includes(key)) {
        return category;
      }
    }

    // 2. Payment method fallback
    if (paymentMethod === 'ATM') return 'Cash Withdrawal';

    return 'Other';
  }
}
