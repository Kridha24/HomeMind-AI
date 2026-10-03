import { z } from 'zod';
import { IntentExtractor, ExtractedAction } from './intentExtractor';

/**
 * SemanticParser — deterministic semantic understanding layer for the Copilot.
 *
 * This is NOT an LLM. It is an offline, rule/lexicon-based layer that:
 *   1. normalize()  — canonicalizes Hinglish spelling variants, Devanagari words/digits,
 *                     and number words ("2 hazaar") into a stable form.
 *   2. analyze()    — scores concepts (money direction, topic, grocery, reminder, query)
 *                     instead of matching whole fixed sentences.
 *   3. resolve()    — builds a strictly-typed proposal, validates it with Zod, and converts
 *                     it to an ExtractedAction (or a clarification when ambiguous).
 *   4. route()      — hybrid router: deterministic high-confidence extractor first, semantic
 *                     layer when the extractor is unresolved or weak.
 *
 * The proposal schema can only carry intent/amount/category/description/date/items.
 * userId / householdId / role are never part of it — they are always derived server-side.
 */

// ---------------------------------------------------------------------------
// 1. NORMALIZATION
// ---------------------------------------------------------------------------

const DEVANAGARI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

// Devanagari → romanized Hinglish. Longer phrases first.
const HINDI_LEXICON: Array<[string, string]> = [
  ['याद दिला दो', 'remind'], ['याद दिलाना', 'remind'], ['याद दिला', 'remind'],
  ['जोड़ दीजिए', 'add kar do'], ['जोड़ दो', 'add kar do'], ['जोड़ो', 'add karo'],
  ['डाल दो', 'add kar do'], ['डालो', 'add karo'],
  ['बना दो', 'bana do'], ['इस महीने', 'is month'], ['खर्च हुआ', 'kharch hua'],
  ['खर्चा', 'kharcha'], ['खर्च', 'kharch'], ['मिला', 'mila'], ['मिले', 'mila'], ['मिली', 'mila'],
  ['आए', 'aaya'], ['आये', 'aaya'], ['आया', 'aaya'], ['आयी', 'aaya'],
  ['दिए', 'diya'], ['दिये', 'diya'], ['दिया', 'diya'], ['गया', 'gaya'], ['गए', 'gaya'], ['गये', 'gaya'],
  ['रुपये', 'rs'], ['रुपए', 'rs'], ['रूपये', 'rs'], ['रुपया', 'rs'], ['रु', 'rs'],
  ['हज़ार', 'hazaar'], ['हजार', 'hazaar'], ['लाख', 'lakh'],
  ['कितना', 'kitna'], ['कितने', 'kitna'], ['महीने', 'month'], ['महीना', 'month'],
  ['आज', 'aaj'], ['कल', 'kal'], ['परसों', 'parso'],
  ['बिजली', 'electricity'], ['बिल', 'bill'], ['भरना', 'bharna'],
  ['दूध', 'milk'], ['ब्रेड', 'bread'], ['अंडे', 'eggs'], ['अंडा', 'eggs'], ['चावल', 'rice'],
  ['आटा', 'atta'], ['चीनी', 'sugar'], ['दाल', 'dal'], ['सब्ज़ी', 'sabzi'], ['सब्जी', 'sabzi'],
  ['राशन', 'ration'], ['किराना', 'grocery'], ['ग्रोसरी', 'grocery'],
  ['ख़त्म', 'khatam'], ['खत्म', 'khatam'], ['पेट्रोल', 'petrol'],
  ['तोहफ़ा', 'gift'], ['तोहफा', 'gift'], ['गिफ्ट', 'gift'], ['उपहार', 'gift'],
  ['सैलरी', 'salary'], ['वेतन', 'salary'], ['तनख्वाह', 'salary'],
  ['इनकम', 'income'], ['आमदनी', 'income'], ['आय', 'income'], ['खाना', 'khana'],
  ['मम्मी', 'mummy'], ['माँ', 'mummy'], ['मां', 'mummy'], ['पापा', 'papa'],
  ['भैया', 'bhaiya'], ['भाई', 'bhai'], ['दीदी', 'didi'], ['दवाई', 'dawai'], ['दवा', 'dawai'],
  ['किराया', 'kiraya'], ['मैंने', 'maine'], ['लिया', 'liya'], ['टास्क', 'task'],
  ['लेना', 'lena'], ['लाना', 'lana'], ['चाहिए', 'chahiye'],
  ['हो', 'ho'], ['में', 'me'], ['पर', 'par'], ['पे', 'pe'], ['का', 'ka'], ['की', 'ki'], ['के', 'ke'],
  ['को', 'ko'], ['से', 'se'], ['ने', 'ne'], ['और', 'aur'], ['है', 'hai'], ['था', 'tha'], ['हुआ', 'hua'],
];

// Romanized spelling variants → canonical forms understood by the deterministic extractor.
// Order matters.
const SPELLING_VARIANTS: Array<[RegExp, string]> = [
  [/\b(plz|pls|please|kripya)\b/gi, ' '],
  [/\b(hogya|hogaya|hogyi|ho\s+gya|ho\s+gyi)\b/gi, 'ho gaya'],
  [/\b(kr\s?do|krdo|kardo|kr\s?de|krde|karde|kar\s+de|kr\s?dena|krdena|kardena|kar\s+dena|kar\s?dijiye|krdijiye)\b/gi, 'kar do'],
  [/\bkro\b/gi, 'karo'],
  [/\bkrna\b/gi, 'karna'],
  [/\b(daal|dal)\s+(do|de|dena|dijiye)\b/gi, 'add kar do'],
  [/\b(me|mein|main|mai|mei)\s+(daal|dal|daalo|dalo)\b(?!\s+khatam)/gi, 'me add'],
  [/\b(daalo|dalo)\b/gi, 'add karo'],
  [/\b(gya|gyaa|gaye|gye|gyi|gayi|gai)\b/gi, 'gaya'],
  [/\bmil\s+gaya\b/gi, 'mila'],
  [/\b(mili|mile|milaa)\b/gi, 'mila'],
  [/\b(aaye|aayi|aya|aye|ayi|aae|aai)\b/gi, 'aaya'],
  [/\b(diye|dia|diyaa)\b/gi, 'diya'],
  [/\b(karch|khrch|kharchaa|kharche)\b/gi, 'kharch'],
  [/\b(khatm|khtm|khatham)\b/gi, 'khatam'],
  [/\byaad\s+(dila|dilana|dilado|dila\s+do|dilaana|dilaa\s+do|dilaiye)\b/gi, 'remind'],
  [/\bremind\s+me(\s+to)?\b/gi, 'remind'],
  [/\b(rupaye|rupaiya|rupees|rupee|rupay|rupiya|inr)\b/gi, 'rs'],
];

function replaceDevanagariWord(text: string, word: string, rep: string): string {
  // \b does not work for Devanagari, so use explicit separators.
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[\\s,.!?।])${escaped}(?=$|[\\s,.!?।])`, 'g');
  return text.replace(re, `$1${rep}`);
}

// ---------------------------------------------------------------------------
// 2. LEXICONS (concepts, not sentences)
// ---------------------------------------------------------------------------

const RECEIVE_WORDS = new Set([
  'mila', 'aaya', 'received', 'receive', 'got', 'earned', 'earn', 'kamaya', 'kamai',
  'credited', 'credit', 'refund', 'cashback', 'bonus', 'income', 'salary', 'tankhwah',
]);
const SPEND_WORDS = new Set([
  'kharch', 'kharcha', 'spent', 'spend', 'paid', 'pay', 'laga', 'lage', 'lagaa', 'lagi',
  'khareeda', 'kharida', 'kharidi', 'bought', 'buy', 'expense', 'debit', 'debited', 'udaya', 'gaya',
]);
const SELF_WORDS = new Set(['maine', 'mene', 'humne', 'hamne', 'mai', 'main', 'hum', 'i']);
const FAMILY_WORDS = new Set([
  'mummy', 'mumma', 'maa', 'mom', 'mother', 'papa', 'dad', 'father', 'pitaji', 'bhaiya', 'bhai',
  'brother', 'didi', 'sister', 'dadi', 'dada', 'nani', 'nana', 'chacha', 'chachi', 'mama', 'mami',
  'bua', 'mausi', 'family', 'uncle', 'aunty',
]);

interface Topic {
  key: string;
  words: string[];
  prior: 'in' | 'out' | 'both';
  incomeSource?: string;
  expenseCategory?: string;
  label: string;
}

// Category vocabulary deliberately matches what IntentExtractor already emits,
// so Copilot-created records stay consistent with each other.
const TOPICS: Topic[] = [
  { key: 'gift', words: ['gift', 'gifts', 'tohfa', 'shagun', 'present'], prior: 'both', incomeSource: 'Gift / Allowance', expenseCategory: 'Shopping', label: 'Gift' },
  { key: 'allowance', words: ['pocket', 'allowance', 'kharchi'], prior: 'in', incomeSource: 'Gift / Allowance', label: 'Allowance' },
  { key: 'salary', words: ['salary', 'tankhwah', 'tankha', 'payroll', 'stipend'], prior: 'in', incomeSource: 'Salary', label: 'Salary' },
  { key: 'freelance', words: ['freelance', 'client', 'gig'], prior: 'in', incomeSource: 'Freelance', label: 'Freelance' },
  { key: 'investment', words: ['dividend', 'interest', 'byaj', 'stocks', 'mutual', 'fd'], prior: 'in', incomeSource: 'Investments', label: 'Investment' },
  { key: 'transport', words: ['petrol', 'diesel', 'fuel', 'cab', 'uber', 'ola', 'rapido', 'auto', 'metro', 'bus', 'train', 'taxi', 'parking', 'toll'], prior: 'out', expenseCategory: 'Transportation', label: 'Transport' },
  { key: 'food', words: ['mess', 'khana', 'food', 'lunch', 'dinner', 'breakfast', 'nashta', 'chai', 'coffee', 'zomato', 'swiggy', 'restaurant', 'canteen', 'snacks', 'pizza'], prior: 'out', expenseCategory: 'Food & Dining', label: 'Food' },
  { key: 'groceries', words: ['sabzi', 'sabji', 'ration', 'kirana', 'grocery', 'groceries', 'vegetables'], prior: 'out', expenseCategory: 'Groceries', label: 'Groceries' },
  { key: 'utilities', words: ['electricity', 'bijli', 'wifi', 'internet', 'broadband', 'recharge', 'gas', 'cylinder', 'water', 'paani'], prior: 'out', expenseCategory: 'Utilities', label: 'Utilities' },
  { key: 'health', words: ['medicine', 'medicines', 'dawai', 'dawa', 'doctor', 'hospital', 'chemist', 'pharmacy', 'checkup'], prior: 'out', expenseCategory: 'Health & Medicine', label: 'Health' },
  { key: 'rent', words: ['rent', 'kiraya', 'pg'], prior: 'out', expenseCategory: 'Housing & Rent', incomeSource: 'Rental Income', label: 'Rent' },
  { key: 'shopping', words: ['kapde', 'clothes', 'shoes', 'amazon', 'flipkart', 'myntra', 'shopping'], prior: 'out', expenseCategory: 'Shopping', label: 'Shopping' },
  { key: 'entertainment', words: ['movie', 'movies', 'cinema', 'game', 'games', 'party', 'outing'], prior: 'out', expenseCategory: 'Entertainment', label: 'Entertainment' },
  { key: 'subscriptions', words: ['netflix', 'spotify', 'prime', 'hotstar', 'subscription', 'youtube'], prior: 'out', expenseCategory: 'Subscriptions', label: 'Subscription' },
  { key: 'education', words: ['fees', 'fee', 'school', 'college', 'tuition', 'books', 'course'], prior: 'out', expenseCategory: 'Education', label: 'Education' },
  { key: 'home', words: ['repair', 'plumber', 'electrician', 'maid', 'bai', 'dhobi', 'laundry', 'cleaning'], prior: 'out', expenseCategory: 'Home & Maintenance', label: 'Home' },
];

// Canonical grocery names (used for canonicalization + splitting run-on lists).
const GROCERY_LEXICON: Record<string, string> = {
  milk: 'Milk', doodh: 'Milk', dudh: 'Milk', bread: 'Bread', eggs: 'Eggs', egg: 'Eggs', anda: 'Eggs', ande: 'Eggs',
  rice: 'Rice', chawal: 'Rice', atta: 'Atta', flour: 'Atta', dal: 'Dal', daal: 'Dal', sugar: 'Sugar', cheeni: 'Sugar',
  chini: 'Sugar', salt: 'Salt', namak: 'Salt', oil: 'Oil', tel: 'Oil', tea: 'Tea', chaipatti: 'Tea', coffee: 'Coffee',
  butter: 'Butter', makhan: 'Butter', paneer: 'Paneer', curd: 'Curd', dahi: 'Curd', onion: 'Onion', onions: 'Onion',
  pyaz: 'Onion', pyaaz: 'Onion', potato: 'Potato', potatoes: 'Potato', aloo: 'Potato', tomato: 'Tomato',
  tomatoes: 'Tomato', tamatar: 'Tomato', soap: 'Soap', sabun: 'Soap', shampoo: 'Shampoo', detergent: 'Detergent',
  biscuit: 'Biscuits', biscuits: 'Biscuits', maggi: 'Maggi', noodles: 'Noodles', banana: 'Banana', bananas: 'Banana',
  kela: 'Banana', apple: 'Apple', apples: 'Apple', seb: 'Apple', ghee: 'Ghee', besan: 'Besan', masala: 'Masala',
  haldi: 'Haldi', toothpaste: 'Toothpaste', cheese: 'Cheese', juice: 'Juice', fruits: 'Fruits', sabzi: 'Vegetables',
};

const GROCERY_CUES = /\b(grocery|groceries|kirana|ration|pantry|shopping list|khatam|out of stock|finished|chahiye|lana hai|lana|laana|le aana|mangwa|mangwana|stock)\b/i;
const REMINDER_CUES = /\b(remind|reminder|yaad|mat bhoolna|bhoolna mat|todo|to-do|karna hai|karna h)\b/i;
const QUERY_CUES = /\b(kitna|kitne|kitni|how much|how many|total|kya hai|batao|bata do|dikhao|show me|summary)\b|\?\s*$/i;
const ACTION_CUES = /\b(add|save|record|note|likh|likho|kar do|karo|entry|daal)\b/i;

// Words that never belong in a title / item name.
const STOPWORDS = new Set([
  'me', 'mein', 'mai', 'main', 'maine', 'mene', 'pe', 'par', 'ka', 'ki', 'ke', 'ko', 'se', 'ne', 'hai', 'hain', 'h',
  'tha', 'thi', 'the', 'hua', 'hui', 'hue', 'ho', 'gaya', 'kar', 'karo', 'do', 'de', 'dena', 'diya', 'mila', 'aaya',
  'add', 'save', 'note', 'record', 'likh', 'likho', 'daal', 'entry', 'please', 'yaar', 'bhai', 'as', 'a', 'an',
  'for', 'to', 'in', 'on', 'of', 'my', 'i', 'it', 'is', 'was', 'rs', 'aaj', 'kal', 'parso', 'today', 'tomorrow',
  'yesterday', 'income', 'expense', 'kharch', 'kharcha', 'spent', 'paid', 'jo', 'wala', 'wali', 'wale', 'ek',
  'abhi', 'bhi', 'aur', 'and', 'list', 'grocery', 'groceries', 'khatam', 'chahiye', 'lana', 'laana', 'stock',
  'remind', 'reminder', 'yaad', 'mujhe', 'humein', 'hume', 'liye', 'wo', 'woh', 'ye', 'yeh', 'na', 'toh', 'to',
  'received', 'got', 'liya', 'li', 'le', 'lo', 'kamaya', 'kirana', 'ration', 'pantry', 'shopping', 'out',
  'finished', 'mangwa', 'mangwana', 'aana', 'week', 'next', 'agle', 'hafte', 'month', 'credited',
]);

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// 3. STRICT PROPOSAL SCHEMA (never contains trusted identity fields)
// ---------------------------------------------------------------------------

export const SemanticProposalSchema = z
  .object({
    intent: z.enum([
      'createIncome', 'createExpense', 'addGroceryItem', 'createTask',
      'getFinanceSummary', 'getBills', 'getTasks', 'clarifyFinanceDirection',
    ]),
    amount: z.number().positive().max(100_000_000).optional(),
    category: z.string().min(1).max(60).optional(),
    description: z.string().min(1).max(120).optional(),
    date: z.string().datetime().optional(),
    items: z.array(z.string().min(1).max(60)).min(1).max(20).optional(),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export type SemanticProposal = z.infer<typeof SemanticProposalSchema>;

export interface SemanticAnalysis {
  normalized: string;
  tokens: string[];
  amount: number | null;
  inScore: number;
  outScore: number;
  topic?: Topic;
  giver?: string;
  isQuery: boolean;
  isReminder: boolean;
  hasGroceryCue: boolean;
  hasActionCue: boolean;
}

// ---------------------------------------------------------------------------
// 4. PARSER
// ---------------------------------------------------------------------------

export class SemanticParser {
  public static normalize(input: string): string {
    let text = (input || '').normalize('NFC');
    text = text.replace(/[०-९]/g, (d) => DEVANAGARI_DIGITS[d] || d);
    for (const [word, rep] of HINDI_LEXICON) {
      text = replaceDevanagariWord(text, word, rep);
    }
    // Number words: "2 hazaar" → 2000, "1.5 lakh" → 150000
    text = text.replace(/\b(\d+(?:\.\d+)?)\s*(hazaar|hazar|hajar|thousand)\b/gi, (_m, n) => String(Math.round(parseFloat(n) * 1000)));
    text = text.replace(/\b(\d+(?:\.\d+)?)\s*(lakh|lac|lakhs)\b/gi, (_m, n) => String(Math.round(parseFloat(n) * 100000)));
    for (const [re, rep] of SPELLING_VARIANTS) {
      text = text.replace(re, rep);
    }
    return text.replace(/\s+/g, ' ').trim();
  }

  public static tokenize(text: string): string[] {
    return text.toLowerCase().split(/[^a-z0-9₹/]+/).filter(Boolean);
  }

  public static analyze(normalized: string): SemanticAnalysis {
    const lower = normalized.toLowerCase();
    const tokens = this.tokenize(lower);
    const amount = IntentExtractor.parseAmount(normalized);
    const groceryFinished = /\bkhatam\s+ho\s+gaya\b/.test(lower);

    let inScore = 0;
    let outScore = 0;

    for (const t of tokens) {
      if (RECEIVE_WORDS.has(t)) inScore += 2;
      if (SPEND_WORDS.has(t)) {
        // "khatam ho gaya" (ran out) is not money leaving.
        if (t === 'gaya' && groceryFinished) continue;
        outScore += 2;
      }
    }

    // "<someone> ne diya" → someone gave me money (income). "maine diya" / "<x> ko diya" → I paid (expense).
    let giver: string | undefined;
    const neMatch = lower.match(/\b([a-z]+)\s+ne\b/);
    if (neMatch) {
      if (SELF_WORDS.has(neMatch[1])) {
        if (/\b(diya|bheja|transfer)\b/.test(lower)) outScore += 2;
      } else {
        giver = neMatch[1];
        if (/\b(diya|bheja|transfer|aaya|mila)\b/.test(lower)) inScore += 3;
      }
    }
    if (/\b[a-z]+\s+ko\s+(?:[\d,₹rs ]+\s+)?diya\b/.test(lower)) outScore += 3;
    if (/\bse\s+mila\b/.test(lower)) inScore += 1;
    if (/\b(li|liya|liye)\b/.test(lower) && !/\bse\b/.test(lower)) outScore += 1; // "500 ki sabzi li"
    if (/\bdiya\b/.test(lower) && inScore === 0 && outScore === 0) outScore += 1;

    if (!giver) {
      const fam = tokens.find((t) => FAMILY_WORDS.has(t));
      if (fam && inScore > outScore) giver = fam;
    }

    const topic = TOPICS.find((tp) => tp.words.some((w) => tokens.includes(w)));
    if (topic) {
      if (topic.prior === 'in') inScore += 1;
      if (topic.prior === 'out') outScore += 1;
    }

    return {
      normalized,
      tokens,
      amount,
      inScore,
      outScore,
      topic,
      giver,
      isQuery: QUERY_CUES.test(lower) && !ACTION_CUES.test(lower),
      isReminder: REMINDER_CUES.test(lower),
      hasGroceryCue: GROCERY_CUES.test(lower),
      hasActionCue: ACTION_CUES.test(lower),
    };
  }

  /** Content words (non-stopword, non-numeric) of a phrase. */
  public static contentWords(text: string): string[] {
    return this.tokenize(text).filter(
      (t) => !STOPWORDS.has(t) && !/^[\d,.₹]+k?$/.test(t) && !FAMILY_WORDS.has(t) && !SELF_WORDS.has(t)
    );
  }

  /** Grocery item extraction: split on separators, strip filler words, canonicalize names. */
  public static extractGroceryItems(normalized: string): string[] {
    const chunks = normalized
      .toLowerCase()
      .split(/,|&|\+|\band\b|\baur\b|\bphir\b/)
      .map((c) => c.trim())
      .filter(Boolean);

    const items: string[] = [];
    for (const chunk of chunks) {
      const words = this.contentWords(chunk).filter((w) => !/^(item|items|kg|g|ltr|litre|liter|packet|packets|pcs)$/.test(w));
      if (words.length === 0) continue;
      // Run-on list of known items ("milk bread eggs") → split into separate items.
      if (words.length > 1 && words.every((w) => GROCERY_LEXICON[w])) {
        items.push(...words.map((w) => GROCERY_LEXICON[w]));
      } else if (words.length === 1) {
        items.push(GROCERY_LEXICON[words[0]] || titleCase(words[0]));
      } else {
        items.push(titleCase(words.map((w) => GROCERY_LEXICON[w]?.toLowerCase() || w).join(' ')));
      }
    }
    return Array.from(new Set(items)).slice(0, 20);
  }

  private static describeIncome(a: SemanticAnalysis): string {
    if (a.topic?.key === 'gift') return a.giver ? `Gift from ${a.giver}` : 'Gift received';
    if (a.giver) return `Received from ${a.giver}`;
    if (a.topic?.incomeSource) return a.topic.label;
    const words = this.contentWords(a.normalized);
    return words.length ? titleCase(words.join(' ')) : 'Income received';
  }

  private static describeExpense(a: SemanticAnalysis, category: string): string {
    const words = this.contentWords(a.normalized);
    if (a.topic?.key === 'gift') return 'Gift';
    return words.length ? titleCase(words.join(' ')) : `${category} expense`;
  }

  /** Build + validate a semantic proposal, then convert it to an executable/clarifying action. */
  public static resolve(normalized: string): ExtractedAction | null {
    const a = this.analyze(normalized);
    const lower = normalized.toLowerCase();

    let proposal: SemanticProposal | null = null;

    // (1) Read-only questions
    if (a.isQuery) {
      if (/\b(bill|bills)\b/.test(lower)) proposal = { intent: 'getBills', confidence: 0.85 };
      else if (/\b(task|tasks|kaam)\b/.test(lower)) proposal = { intent: 'getTasks', confidence: 0.85 };
      else if (/\b(kharch|kharcha|expense|expenses|spent|spend|income|kamaya|savings|bachat|paisa|paise)\b/.test(lower)) {
        proposal = { intent: 'getFinanceSummary', confidence: 0.85 };
      }
    }

    // (2) Reminders / tasks
    if (!proposal && a.isReminder) {
      const title = normalized
        .replace(/\b(remind|reminder|yaad|mat bhoolna|bhoolna mat|todo|to-do|mujhe|humein|please)\b/gi, ' ')
        .replace(/\b(kal|aaj|parso|today|tomorrow|next week|agle hafte|day after tomorrow)\b/gi, ' ')
        .replace(/\b(kar do|karo|ka task bana do|task bana do|bana do)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (title.length >= 2) {
        proposal = {
          intent: 'createTask',
          description: titleCase(title).slice(0, 120),
          date: IntentExtractor.parseDate(normalized).toISOString(),
          confidence: 0.8,
        };
      }
    }

    // (3) Groceries (no money amount, or an explicit list cue)
    if (
      !proposal &&
      a.hasGroceryCue &&
      (a.amount === null || (/\b(grocery|list|kirana|ration)\b/.test(lower) && a.outScore === 0))
    ) {
      const items = this.extractGroceryItems(normalized);
      if (items.length > 0) {
        proposal = { intent: 'addGroceryItem', items, confidence: 0.8 };
      }
    }

    // (4) Money: decide direction by concept scores, ask when genuinely ambiguous
    if (!proposal && a.amount !== null && a.amount > 0) {
      const diff = a.inScore - a.outScore;
      const bidirectionalTopic = a.topic?.prior === 'both';

      if (diff === 0 || (bidirectionalTopic && a.inScore === 0 && a.outScore === 0)) {
        proposal = {
          intent: 'clarifyFinanceDirection',
          amount: a.amount,
          description: a.topic?.label,
          confidence: 0.5,
        };
      } else if (diff > 0) {
        proposal = {
          intent: 'createIncome',
          amount: a.amount,
          category: a.topic?.incomeSource || (a.giver && FAMILY_WORDS.has(a.giver) ? 'Family' : 'Other'),
          description: this.describeIncome(a),
          date: IntentExtractor.parseDate(normalized).toISOString(),
          confidence: Math.min(0.95, 0.6 + 0.1 * diff),
        };
      } else {
        const category = a.topic?.expenseCategory || 'General';
        proposal = {
          intent: 'createExpense',
          amount: a.amount,
          category,
          description: this.describeExpense(a, category),
          date: IntentExtractor.parseDate(normalized).toISOString(),
          confidence: Math.min(0.95, 0.6 + 0.1 * Math.abs(diff)),
        };
      }
    }

    if (!proposal) return null;

    // Strict validation — anything malformed is dropped, never executed.
    const parsed = SemanticProposalSchema.safeParse(proposal);
    if (!parsed.success) {
      console.warn('[COPILOT] semantic proposal rejected by schema');
      return null;
    }
    return this.toAction(parsed.data);
  }

  private static toAction(p: SemanticProposal): ExtractedAction {
    switch (p.intent) {
      case 'createIncome':
        return {
          tool: 'createIncome',
          args: { title: p.description, amount: p.amount, source: p.category, date: p.date },
          riskLevel: 'LOW',
          confidence: p.confidence,
        };
      case 'createExpense':
        return {
          tool: 'createExpense',
          args: { title: p.description, amount: p.amount, category: p.category, date: p.date },
          riskLevel: 'LOW',
          confidence: p.confidence,
        };
      case 'addGroceryItem':
        return {
          tool: 'addGroceryItem',
          args: {
            items: (p.items || []).map((name) => ({ name, quantity: 1, unit: 'pcs', category: 'Pantry Items' })),
          },
          riskLevel: 'LOW',
          confidence: p.confidence,
        };
      case 'createTask':
        return {
          tool: 'createTask',
          args: { title: p.description, priority: 'MEDIUM', dueDate: p.date },
          riskLevel: 'LOW',
          confidence: p.confidence,
        };
      case 'getBills':
        return { tool: 'getBills', args: { status: 'UNPAID' }, riskLevel: 'LOW', confidence: p.confidence };
      case 'getTasks':
        return { tool: 'getTasks', args: { status: 'PENDING' }, riskLevel: 'LOW', confidence: p.confidence };
      case 'getFinanceSummary':
        return { tool: 'getFinanceSummary', args: { period: 'month' }, riskLevel: 'LOW', confidence: p.confidence };
      case 'clarifyFinanceDirection':
      default: {
        const amt = p.amount as number;
        const shown = `₹${amt.toLocaleString('en-IN')}`;
        const isGift = p.description === 'Gift';
        const topicWord = p.description ? p.description.toLowerCase() : '';
        return {
          tool: 'createIncome', // placeholder; never executed while isAmbiguous
          args: { amount: amt },
          riskLevel: 'LOW',
          confidence: p.confidence,
          isAmbiguous: true,
          clarificationQuestion: isGift
            ? `${shown} gift ke roop me mila tha ya ${shown} gift par kharch hua?`
            : `${shown}${topicWord ? ` (${topicWord})` : ''} aapko mila tha (Income) ya aapne kharch kiya (Expense)?`,
          clarificationOptions: isGift
            ? [
                { label: 'Gift Received', actionPayload: `${amt} rs income me add kar do gift mila tha` },
                { label: 'Gift Expense', actionPayload: `${amt} rs gift pe kharch hua` },
              ]
            : [
                { label: 'Income', actionPayload: `${amt} rs income me add kar do${topicWord ? ` ${topicWord}` : ''}` },
                { label: 'Expense', actionPayload: `${amt} rs${topicWord ? ` ${topicWord}` : ''} pe kharch hua` },
              ],
        };
      }
    }
  }

  /** Improve category/title of a deterministic finance intent using semantic analysis. */
  private static enrichFinance(det: ExtractedAction, normalized: string): ExtractedAction {
    const a = this.analyze(normalized);
    const args = { ...det.args };
    const junkTitle = !args.title || this.contentWords(String(args.title)).length === 0;

    if (det.tool === 'createIncome') {
      if ((!args.source || args.source === 'Other Income') && a.topic?.incomeSource) args.source = a.topic.incomeSource;
      if (a.topic?.key === 'gift') args.title = this.describeIncome(a);
      else if (junkTitle) args.title = this.describeIncome(a);
    } else if (det.tool === 'createExpense') {
      if ((!args.category || args.category === 'General') && a.topic?.expenseCategory) args.category = a.topic.expenseCategory;
      if (a.topic?.key === 'gift') args.title = 'Gift';
      else if (junkTitle) args.title = this.describeExpense(a, args.category || 'General');
    }
    return { ...det, args };
  }

  /**
   * Hybrid router:
   *   deterministic extractor (high-confidence, explicit commands, destructive ops, follow-ups)
   *   → semantic layer when the extractor returns nothing or a weak finance guess.
   */
  public static route(
    message: string,
    members: Array<{ id: string; name: string }>,
    previousAction?: Parameters<typeof IntentExtractor.extract>[2]
  ): { intent: ExtractedAction | null; normalized: string; source: 'deterministic' | 'semantic' | 'none' } {
    const normalized = this.normalize(message);
    const det = IntentExtractor.extract(normalized, members, previousAction);
    const lower = normalized.toLowerCase();

    const isFinance = !!det && (det.tool === 'createIncome' || det.tool === 'createExpense') && !det.isAmbiguous;

    // Non-finance deterministic hits are trusted, except grocery items which get the better item extractor.
    if (det && !isFinance) {
      if (det.tool === 'addGroceryItem') {
        const a = this.analyze(normalized);
        // "500 ka grocery kharch hua" is spending, not a list item.
        if (a.amount !== null && a.outScore > 0) {
          const sem = this.resolve(normalized);
          if (sem && sem.tool === 'createExpense') return { intent: sem, normalized, source: 'semantic' };
        }
        const items = this.extractGroceryItems(normalized);
        if (items.length > 0) {
          det.args = {
            ...det.args,
            items: items.map((name) => ({ name, quantity: 1, unit: 'pcs', category: 'Pantry Items' })),
          };
        }
      }
      return { intent: det, normalized, source: 'deterministic' };
    }

    const sem = this.resolve(normalized);

    if (det && isFinance) {
      const explicit = /\b(income|expense|kharch|kharcha|salary|spent|paid)\b/.test(lower);
      // A weak keyword match (e.g. "diya") must not override a clear semantic direction ("mummy ne diya").
      if (!explicit && sem && sem.tool !== det.tool) {
        return { intent: sem, normalized, source: 'semantic' };
      }
      return { intent: this.enrichFinance(det, normalized), normalized, source: 'deterministic' };
    }

    return { intent: sem, normalized, source: sem ? 'semantic' : 'none' };
  }
}
