const USER_MAPPING_STORAGE_KEY = 'homemind_merchant_category_mappings';

const DEFAULT_MERCHANT_CATEGORIES: Record<string, string> = {
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
  CAFE: 'Food',
  RESTAURANT: 'Food',

  // Groceries
  BLINKIT: 'Groceries',
  ZEPTO: 'Groceries',
  INSTAMART: 'Groceries',
  BIGBASKET: 'Groceries',
  DMART: 'Groceries',
  NATURESBASKET: 'Groceries',
  RELIANCEFRESH: 'Groceries',
  SPENCERS: 'Groceries',
  SUPERMARKET: 'Groceries',
  KIRANA: 'Groceries',

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
  SHELL: 'Transport',
  IRCTC: 'Transport',
  MAKEMYTRIP: 'Transport',

  // Shopping
  AMAZON: 'Shopping',
  FLIPKART: 'Shopping',
  MYNTRA: 'Shopping',
  MEESHO: 'Shopping',
  AJIO: 'Shopping',
  NYKAA: 'Shopping',
  TATACLIQ: 'Shopping',
  ZARA: 'Shopping',
  DECATHLON: 'Shopping',

  // Entertainment
  NETFLIX: 'Entertainment',
  SPOTIFY: 'Entertainment',
  HOTSTAR: 'Entertainment',
  DISNEY: 'Entertainment',
  PRIMEVIDEO: 'Entertainment',
  YOUTUBE: 'Entertainment',
  BOOKMYSHOW: 'Entertainment',
  PVR: 'Entertainment',
  INOX: 'Entertainment',

  // Utilities & Bills
  AIRTEL: 'Bills',
  JIO: 'Bills',
  VODAFONE: 'Bills',
  VI: 'Bills',
  BESCOM: 'Bills',
  ELECTRICITY: 'Bills',
  GAS: 'Bills',
  BROADBAND: 'Bills',
  RECHARGE: 'Bills',

  // Healthcare
  APOLLO: 'Healthcare',
  PHARMEASY: 'Healthcare',
  ONEMG: 'Healthcare',
  NETMEDS: 'Healthcare',
  MEDPLUS: 'Healthcare',
  HOSPITAL: 'Healthcare',

  // Income / Refund / Cashback
  SALARY: 'Salary',
  PAYROLL: 'Salary',
  DIVIDEND: 'Investment',
  INTEREST: 'Interest',
  CASHBACK: 'Cashback',
  REFUND: 'Refund'
};

export class TransactionCategorizer {
  private static getUserMappings(): Record<string, string> {
    try {
      const data = localStorage.getItem(USER_MAPPING_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save a user-defined category mapping for a merchant
   */
  static saveUserMapping(merchant: string, category: string): void {
    if (!merchant || !category) return;
    try {
      const clean = merchant.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const existing = this.getUserMappings();
      existing[clean] = category.trim();
      localStorage.setItem(USER_MAPPING_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save merchant category preference:', e);
    }
  }

  /**
   * Inactive/learned categorization
   */
  static categorize(
    merchant?: string | null,
    paymentMethod?: string | null,
    type?: string | null
  ): string {
    if (type === 'CREDIT') {
      if (merchant) {
        const clean = merchant.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean.includes('SALARY') || clean.includes('PAYROLL')) return 'Salary';
        if (clean.includes('REFUND')) return 'Refund';
        if (clean.includes('CASHBACK')) return 'Cashback';
        if (clean.includes('INTEREST')) return 'Interest';
        if (clean.includes('DIVIDEND')) return 'Investment';
      }
      return 'Income';
    }

    if (!merchant || merchant.trim() === '') {
      if (paymentMethod === 'ATM') return 'Cash Withdrawal';
      return 'Other';
    }

    const cleanMerchant = merchant.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 1. Check user-learned preferences first!
    const userMappings = this.getUserMappings();
    if (userMappings[cleanMerchant]) {
      return userMappings[cleanMerchant];
    }

    // 2. Check defaults
    for (const [key, category] of Object.entries(DEFAULT_MERCHANT_CATEGORIES)) {
      if (cleanMerchant.includes(key)) {
        return category;
      }
    }

    // 3. Method fallback
    if (paymentMethod === 'ATM') return 'Cash Withdrawal';

    return 'Other';
  }
}
