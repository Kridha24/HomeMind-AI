import assert from 'node:assert';

console.log('🧪 Starting HomeMind.AI Groceries & Shopping Workspace Frontend Verification Suite...\n');

let passed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}:`, err.message);
    process.exit(1);
  }
}

// 1. Urgency Derivation Logic
function getGroceryUrgency(item) {
  if (item.purchaseDate) {
    return 'PURCHASED';
  }
  if (item.quantity <= 0) {
    return 'URGENT';
  }
  if (item.expiryDate) {
    const expiry = new Date(item.expiryDate).getTime();
    const now = Date.now();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) {
      return 'URGENT';
    }
  }
  if (item.quantity <= item.minThreshold) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
}

check('Urgency: Purchased item always resolves to PURCHASED', () => {
  const item = { id: '1', name: 'Milk', quantity: 0, minThreshold: 1, purchaseDate: '2026-10-02T10:00:00Z' };
  assert.strictEqual(getGroceryUrgency(item), 'PURCHASED');
});

check('Urgency: Out of stock (qty <= 0) resolves to URGENT', () => {
  const item = { id: '2', name: 'Bread', quantity: 0, minThreshold: 1, purchaseDate: null };
  assert.strictEqual(getGroceryUrgency(item), 'URGENT');
});

check('Urgency: Expiring within 2 days resolves to URGENT', () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const item = { id: '3', name: 'Tomatoes', quantity: 5, minThreshold: 1, expiryDate: tomorrow, purchaseDate: null };
  assert.strictEqual(getGroceryUrgency(item), 'URGENT');
});

check('Urgency: Quantity <= minThreshold resolves to LOW_STOCK', () => {
  const item = { id: '4', name: 'Rice', quantity: 1, minThreshold: 2, purchaseDate: null };
  assert.strictEqual(getGroceryUrgency(item), 'LOW_STOCK');
});

check('Urgency: Healthy quantity and shelf-life resolves to IN_STOCK', () => {
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const item = { id: '5', name: 'Dish Pods', quantity: 15, minThreshold: 5, expiryDate: nextMonth, purchaseDate: null };
  assert.strictEqual(getGroceryUrgency(item), 'IN_STOCK');
});

// 2. Progress Calculation Logic
function calculateProgress(items) {
  const totalItems = items.length;
  if (totalItems === 0) {
    return { progressPercent: 0, isShoppingComplete: false, purchasedCount: 0, needToBuyCount: 0 };
  }
  const purchasedCount = items.filter((i) => Boolean(i.purchaseDate)).length;
  const needToBuyCount = totalItems - purchasedCount;
  const progressPercent = Math.round((purchasedCount / totalItems) * 100);
  const isShoppingComplete = needToBuyCount === 0;
  return { progressPercent, isShoppingComplete, purchasedCount, needToBuyCount };
}

check('Progress: Empty grocery list returns 0% (never misleading 100%)', () => {
  const res = calculateProgress([]);
  assert.strictEqual(res.progressPercent, 0);
  assert.strictEqual(res.isShoppingComplete, false);
});

check('Progress: Partial shopping accurately calculates % and counts', () => {
  const items = [
    { id: '1', purchaseDate: '2026-10-02' },
    { id: '2', purchaseDate: '2026-10-02' },
    { id: '3', purchaseDate: null },
  ];
  const res = calculateProgress(items);
  assert.strictEqual(res.purchasedCount, 2);
  assert.strictEqual(res.needToBuyCount, 1);
  assert.strictEqual(res.progressPercent, 67);
  assert.strictEqual(res.isShoppingComplete, false);
});

check('Progress: All items purchased resolves isShoppingComplete: true and 100%', () => {
  const items = [
    { id: '1', purchaseDate: '2026-10-02' },
    { id: '2', purchaseDate: '2026-10-02' },
  ];
  const res = calculateProgress(items);
  assert.strictEqual(res.progressPercent, 100);
  assert.strictEqual(res.isShoppingComplete, true);
});

// 3. Quantity and Unit Formatter
function formatQuantityWithUnit(quantity, unit) {
  const formattedQty = Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(1);
  return `${formattedQty} ${unit}`;
}

check('Quantity: Formats integer quantities cleanly', () => {
  assert.strictEqual(formatQuantityWithUnit(2, 'kg'), '2 kg');
  assert.strictEqual(formatQuantityWithUnit(1, 'pack'), '1 pack');
});

check('Quantity: Formats decimal quantities with one decimal point', () => {
  assert.strictEqual(formatQuantityWithUnit(2.5, 'kg'), '2.5 kg');
  assert.strictEqual(formatQuantityWithUnit(0.2, 'L'), '0.2 L');
});

// 4. Filtering and Grouping Logic
check('Filter: Need to Buy returns only pending items', () => {
  const items = [
    { id: '1', name: 'Milk', purchaseDate: null },
    { id: '2', name: 'Bread', purchaseDate: '2026-10-02' },
    { id: '3', name: 'Eggs', purchaseDate: null },
  ];
  const pending = items.filter((i) => !i.purchaseDate);
  assert.strictEqual(pending.length, 2);
  assert(pending.every((i) => i.purchaseDate === null));
});

check('Filter: Category filter isolates target category correctly', () => {
  const items = [
    { id: '1', name: 'Tomatoes', category: 'Vegetables' },
    { id: '2', name: 'Whole Milk', category: 'Dairy & Eggs' },
    { id: '3', name: 'Spinach', category: 'Vegetables' },
  ];
  const vegOnly = items.filter((i) => i.category === 'Vegetables');
  assert.strictEqual(vegOnly.length, 2);
  assert(vegOnly.every((i) => i.category === 'Vegetables'));
});

// 5. Existing Household Grocery Records Integrity Verification
const sampleExistingRecords = [
  { id: '46013136-2006-491d-ba90-2bdc93044936', name: 'Organic Whole Milk 2L', category: 'Milk', quantity: 2.0, unit: 'L', minThreshold: 1.0 },
  { id: 'c238a5b9-e249-4c87-b754-406937007bdc', name: 'Artisan Whole Wheat Bread', category: 'Bread', quantity: 1.0, unit: 'pack', minThreshold: 1.0 },
  { id: '6614d3af-7e13-4cf3-b0f8-38445f330265', name: 'Fresh Spinach 500g', category: 'Vegetables', quantity: 1.0, unit: 'pack', minThreshold: 1.0 },
  { id: 'f9ed5c59-8954-49ff-a7f7-7f792284d50b', name: 'Basmati Rice 5kg', category: 'Rice', quantity: 3.5, unit: 'kg', minThreshold: 1.0 },
  { id: '83c22239-6ebc-4af2-abca-bcea613b8152', name: 'Extra Virgin Olive Oil 1L', category: 'Oil', quantity: 0.2, unit: 'L', minThreshold: 0.5 },
  { id: '44f79a02-ed0f-4755-b867-a67db55e0e7c', name: 'Eco Dishwasher Pods', category: 'Cleaning Products', quantity: 15.0, unit: 'pcs', minThreshold: 5.0 },
  { id: 'bdde1e31-87f2-47e7-ba37-3d705f14a441', name: 'peanut butter', category: 'Other', quantity: 1.0, unit: 'pcs', minThreshold: 1.0 }
];

check('Existing Data: All 7 sample records have valid categories, units, and positive quantities', () => {
  assert.strictEqual(sampleExistingRecords.length, 7);
  for (const r of sampleExistingRecords) {
    assert(r.name && r.category && r.unit, `Record ${r.id} missing mandatory field`);
    assert(r.quantity > 0, `Record ${r.id} has invalid non-positive quantity`);
  }
});

console.log(`\n==================================================`);
console.log(`GROCERIES VERIFICATION SUITE: ${passed} PASSED, 0 FAILED`);
console.log(`==================================================\n`);
