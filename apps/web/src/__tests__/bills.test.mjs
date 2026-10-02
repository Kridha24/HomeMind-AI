import assert from 'node:assert';

console.log('🧪 Starting HomeMind.AI Bills & Recurring Payments Workspace Verification Suite...\n');

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

// 1. Currency Formatter (INR)
function formatINR(amount) {
  const safeNum = Math.abs(Number(amount) || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: safeNum % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(safeNum);
}

check('Currency: Format ₹4,000 correctly', () => {
  const res = formatINR(4000);
  assert(res.includes('4,000'), `Expected 4,000 in ${res}`);
});

check('Currency: Large values format without overflow (₹1,00,00,000)', () => {
  const res = formatINR(10000000);
  assert(res.includes('1,00,00,000'), `Expected 1,00,00,000 in ${res}`);
});

check('Currency: Small values format cleanly (₹99)', () => {
  const res = formatINR(99);
  assert(res.includes('99'), `Expected 99 in ${res}`);
});

// 2. Status Derivation Logic
function deriveBillDisplayStatus(bill, refDate = new Date('2026-10-02T12:00:00Z')) {
  const due = new Date(bill.dueDate);
  const formattedDueDate = due.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  if (bill.status === 'PAID') {
    const paidDate = bill.paidAt ? new Date(bill.paidAt) : null;
    const paidLabel = paidDate
      ? `Paid ${paidDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : 'Paid';
    return { key: 'PAID', label: paidLabel };
  }

  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const refMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
  const diffDays = Math.round((dueMidnight - refMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { key: 'OVERDUE', label: `Overdue by ${Math.abs(diffDays)}d` };
  }
  if (diffDays === 0) {
    return { key: 'DUE_TODAY', label: 'Due today' };
  }
  if (diffDays === 1) {
    return { key: 'DUE_SOON', label: 'Due tomorrow' };
  }
  if (diffDays <= 3) {
    return { key: 'DUE_SOON', label: `Due in ${diffDays} days` };
  }
  return { key: 'UPCOMING', label: `Due ${formattedDueDate}` };
}

const FIXED_NOW = new Date('2026-10-02T12:00:00Z');

check('Status Derivation: Bill paid status maps to PAID', () => {
  const bill = {
    title: 'Internet',
    status: 'PAID',
    amount: 1199,
    dueDate: '2026-09-28T00:00:00Z',
    paidAt: '2026-09-28T10:00:00Z',
  };
  const status = deriveBillDisplayStatus(bill, FIXED_NOW);
  assert.strictEqual(status.key, 'PAID');
  assert(status.label.includes('Paid 28 Sep'));
});

check('Status Derivation: Overdue bill derives OVERDUE with days count', () => {
  const bill = {
    title: 'Past Rent',
    status: 'UNPAID',
    amount: 4000,
    dueDate: '2026-09-30T00:00:00Z',
  };
  const status = deriveBillDisplayStatus(bill, FIXED_NOW);
  assert.strictEqual(status.key, 'OVERDUE');
  assert.strictEqual(status.label, 'Overdue by 2d');
});

check('Status Derivation: Bill due on ref date derives DUE_TODAY', () => {
  const bill = {
    title: 'Electricity',
    status: 'UNPAID',
    amount: 1500,
    dueDate: '2026-10-02T18:00:00Z',
  };
  const status = deriveBillDisplayStatus(bill, FIXED_NOW);
  assert.strictEqual(status.key, 'DUE_TODAY');
  assert.strictEqual(status.label, 'Due today');
});

check('Status Derivation: Bill due tomorrow derives Due tomorrow', () => {
  const bill = {
    title: 'Water Bill',
    status: 'UNPAID',
    amount: 300,
    dueDate: '2026-10-03T10:00:00Z',
  };
  const status = deriveBillDisplayStatus(bill, FIXED_NOW);
  assert.strictEqual(status.key, 'DUE_SOON');
  assert.strictEqual(status.label, 'Due tomorrow');
});

check('Status Derivation: Bill due in 3 days derives Due in 3 days', () => {
  const bill = {
    title: 'pg rent',
    status: 'UNPAID',
    amount: 4000,
    dueDate: '2026-10-05T00:00:00Z',
  };
  const status = deriveBillDisplayStatus(bill, FIXED_NOW);
  assert.strictEqual(status.key, 'DUE_SOON');
  assert.strictEqual(status.label, 'Due in 3 days');
});

check('Status Derivation: Bill due in 10 days derives UPCOMING', () => {
  const bill = {
    title: 'Broadband',
    status: 'UNPAID',
    amount: 999,
    dueDate: '2026-10-12T00:00:00Z',
  };
  const status = deriveBillDisplayStatus(bill, FIXED_NOW);
  assert.strictEqual(status.key, 'UPCOMING');
  assert(status.label.includes('Due 12 Oct'));
});

// 3. Summary Strip Calculations
function calculateBillSummary(bills, refDate = new Date('2026-10-02T12:00:00Z')) {
  const currentMonth = refDate.getMonth();
  const currentYear = refDate.getFullYear();

  let totalDue = 0;
  let unpaidCount = 0;
  let dueThisWeekCount = 0;
  let dueThisWeekAmount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let paidThisMonthAmount = 0;

  const nowMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
  const next7DaysMidnight = nowMidnight + 7 * 24 * 60 * 60 * 1000;

  for (const b of bills) {
    const amount = Number(b.amount) || 0;
    if (b.status === 'PAID') {
      const paidDate = b.paidAt ? new Date(b.paidAt) : new Date(b.dueDate);
      if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
        paidThisMonthAmount += amount;
      }
      continue;
    }

    totalDue += amount;
    unpaidCount++;

    const due = new Date(b.dueDate);
    const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();

    if (dueMidnight < nowMidnight) {
      overdueCount++;
      overdueAmount += amount;
    } else if (dueMidnight <= next7DaysMidnight) {
      dueThisWeekCount++;
      dueThisWeekAmount += amount;
    }
  }

  return {
    totalDue: Math.round(totalDue * 100) / 100,
    unpaidCount,
    dueThisWeekCount,
    dueThisWeekAmount: Math.round(dueThisWeekAmount * 100) / 100,
    overdueCount,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    paidThisMonthAmount: Math.round(paidThisMonthAmount * 100) / 100,
  };
}

check('Summary: Critical Test - Existing unpaid bill of ₹4,000 produces Total Due = ₹4,000', () => {
  const bills = [
    { id: '1', title: 'pg rent', amount: 4000, dueDate: '2026-10-05T00:00:00Z', status: 'UNPAID' }
  ];
  const summary = calculateBillSummary(bills, FIXED_NOW);
  assert.strictEqual(summary.totalDue, 4000);
  assert.strictEqual(summary.unpaidCount, 1);
  assert.strictEqual(summary.dueThisWeekCount, 1);
  assert.strictEqual(summary.overdueCount, 0);
  assert.strictEqual(summary.paidThisMonthAmount, 0);
});

check('Summary: Mixed bill list computes accurate metrics', () => {
  const bills = [
    { id: '1', title: 'pg rent', amount: 4000, dueDate: '2026-10-05T00:00:00Z', status: 'UNPAID' },
    { id: '2', title: 'Old Power', amount: 1500, dueDate: '2026-09-20T00:00:00Z', status: 'UNPAID' },
    { id: '3', title: 'Paid Wifi', amount: 1199, dueDate: '2026-10-01T00:00:00Z', status: 'PAID', paidAt: '2026-10-01T10:00:00Z' },
    { id: '4', title: 'Future Rent', amount: 4000, dueDate: '2026-11-05T00:00:00Z', status: 'UNPAID' },
  ];
  const summary = calculateBillSummary(bills, FIXED_NOW);
  assert.strictEqual(summary.totalDue, 4000 + 1500 + 4000); // 9500
  assert.strictEqual(summary.overdueCount, 1);
  assert.strictEqual(summary.overdueAmount, 1500);
  assert.strictEqual(summary.dueThisWeekCount, 1);
  assert.strictEqual(summary.dueThisWeekAmount, 4000);
  assert.strictEqual(summary.paidThisMonthAmount, 1199);
});

console.log(`\n==================================================`);
console.log(`BILLS VERIFICATION SUITE: ${passed} PASSED, 0 FAILED`);
console.log(`==================================================\n`);
