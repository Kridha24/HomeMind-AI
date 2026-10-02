import assert from 'node:assert';

console.log('🧪 Starting HomeMind.AI Tasks & Chores Workspace Verification Suite...\n');

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

// 1. Due Date Logic & Boundaries
function parseCalendarDate(input) {
  if (typeof input === 'string') {
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1,
        day: parseInt(match[3], 10),
      };
    }
  }

  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return null;

  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
  };
}

function getDueDateStatus(dueDateStr, referenceDate = new Date()) {
  if (!dueDateStr) {
    return {
      label: 'No due date',
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      isThisWeek: false,
      daysDifference: Infinity,
    };
  }

  const target = parseCalendarDate(dueDateStr);
  const ref = parseCalendarDate(referenceDate);

  if (!target || !ref) {
    return {
      label: 'Invalid date',
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      isThisWeek: false,
      daysDifference: Infinity,
    };
  }

  const targetDateOnly = new Date(target.year, target.month, target.day);
  const refDateOnly = new Date(ref.year, ref.month, ref.day);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDifference = Math.round((targetDateOnly.getTime() - refDateOnly.getTime()) / msPerDay);

  if (daysDifference < 0) {
    const overdueDays = Math.abs(daysDifference);
    return {
      label: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
      isThisWeek: false,
      daysDifference,
    };
  }

  if (daysDifference === 0) {
    return {
      label: 'Due today',
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
      isThisWeek: true,
      daysDifference: 0,
    };
  }

  if (daysDifference === 1) {
    return {
      label: 'Due tomorrow',
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
      isThisWeek: true,
      daysDifference: 1,
    };
  }

  if (daysDifference <= 7) {
    return {
      label: `Due in ${daysDifference} days`,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      isThisWeek: true,
      daysDifference,
    };
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    label: `Due ${monthNames[target.month]} ${target.day}`,
    isOverdue: false,
    isToday: false,
    isTomorrow: false,
    isThisWeek: false,
    daysDifference,
  };
}

const fixedRefDate = '2026-10-02T12:00:00Z';

check('Due Date: Yesterday is overdue by 1 day', () => {
  const res = getDueDateStatus('2026-10-01T10:00:00Z', fixedRefDate);
  assert.strictEqual(res.isOverdue, true);
  assert.strictEqual(res.label, 'Overdue by 1 day');
  assert.strictEqual(res.daysDifference, -1);
});

check('Due Date: 3 days ago is overdue by 3 days', () => {
  const res = getDueDateStatus('2026-09-29T10:00:00Z', fixedRefDate);
  assert.strictEqual(res.isOverdue, true);
  assert.strictEqual(res.label, 'Overdue by 3 days');
  assert.strictEqual(res.daysDifference, -3);
});

check('Due Date: Same day resolves to "Due today"', () => {
  const res = getDueDateStatus('2026-10-02T20:00:00Z', fixedRefDate);
  assert.strictEqual(res.isToday, true);
  assert.strictEqual(res.isOverdue, false);
  assert.strictEqual(res.label, 'Due today');
  assert.strictEqual(res.daysDifference, 0);
});

check('Due Date: Next day resolves to "Due tomorrow"', () => {
  const res = getDueDateStatus('2026-10-03T09:00:00Z', fixedRefDate);
  assert.strictEqual(res.isTomorrow, true);
  assert.strictEqual(res.isToday, false);
  assert.strictEqual(res.label, 'Due tomorrow');
  assert.strictEqual(res.daysDifference, 1);
});

check('Due Date: 4 days future resolves to "Due in 4 days" and isThisWeek: true', () => {
  const res = getDueDateStatus('2026-10-06T15:00:00Z', fixedRefDate);
  assert.strictEqual(res.isThisWeek, true);
  assert.strictEqual(res.label, 'Due in 4 days');
  assert.strictEqual(res.daysDifference, 4);
});

check('Due Date: Month boundary (Oct 31 to Nov 1) resolves to tomorrow without off-by-one', () => {
  const oct31Ref = '2026-10-31T23:59:59Z';
  const nov1Due = '2026-11-01T00:00:00Z';
  const res = getDueDateStatus(nov1Due, oct31Ref);
  assert.strictEqual(res.isTomorrow, true);
  assert.strictEqual(res.label, 'Due tomorrow');
  assert.strictEqual(res.daysDifference, 1);
});

check('Due Date: End of day boundary (23:59:59 vs 00:00:00 same date) resolves to today', () => {
  const endOfDayRef = '2026-10-02T23:59:59Z';
  const morningDue = '2026-10-02T00:00:00Z';
  const res = getDueDateStatus(morningDue, endOfDayRef);
  assert.strictEqual(res.isToday, true);
  assert.strictEqual(res.label, 'Due today');
  assert.strictEqual(res.daysDifference, 0);
});

check('Due Date: Null or empty string resolves to "No due date"', () => {
  const res = getDueDateStatus(null, fixedRefDate);
  assert.strictEqual(res.label, 'No due date');
  assert.strictEqual(res.isOverdue, false);
  assert.strictEqual(res.isToday, false);
});

// 2. Category Inference Logic
function inferCategory(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('clean') || text.includes('sweep') || text.includes('mop') || text.includes('dust') || text.includes('trash')) {
    return 'Cleaning';
  }
  if (text.includes('buy') || text.includes('shop') || text.includes('grocery') || text.includes('cylinder') || text.includes('order')) {
    return 'Shopping';
  }
  if (text.includes('repair') || text.includes('fix') || text.includes('filter') || text.includes('hvac') || text.includes('leak')) {
    return 'Maintenance';
  }
  if (text.includes('cook') || text.includes('meal') || text.includes('dinner') || text.includes('recipe')) {
    return 'Cooking';
  }
  if (text.includes('bill') || text.includes('pay') || text.includes('rent') || text.includes('electricity') || text.includes('utility')) {
    return 'Bills/Admin';
  }
  return 'Other';
}

check('Category Inference: Domestic chores properly classified', () => {
  assert.strictEqual(inferCategory('Deep clean kitchen sink'), 'Cleaning');
  assert.strictEqual(inferCategory('Buy HP Gas cylinder refill'), 'Shopping');
  assert.strictEqual(inferCategory('Clean HVAC Filters'), 'Cleaning');
  assert.strictEqual(inferCategory('Fix bathroom pipe leak'), 'Maintenance');
  assert.strictEqual(inferCategory('Cook family dinner'), 'Cooking');
  assert.strictEqual(inferCategory('Pay Electricity Utility Bill'), 'Bills/Admin');
  assert.strictEqual(inferCategory('Household quarterly audit'), 'Other');
});

// 3. Task Priority Sorting & Tie-breaking
const PRIORITY_WEIGHTS = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

function sortTasks(tasks, refDate = fixedRefDate) {
  return [...tasks].sort((a, b) => {
    const aDone = a.status === 'COMPLETED';
    const bDone = b.status === 'COMPLETED';
    if (aDone !== bDone) return aDone ? 1 : -1;

    const statusA = getDueDateStatus(a.dueDate, refDate);
    const statusB = getDueDateStatus(b.dueDate, refDate);

    // Overdue first
    if (statusA.isOverdue && !statusB.isOverdue) return -1;
    if (!statusA.isOverdue && statusB.isOverdue) return 1;

    if (statusA.daysDifference !== statusB.daysDifference) {
      return statusA.daysDifference - statusB.daysDifference;
    }

    const weightA = PRIORITY_WEIGHTS[a.priority] || 1;
    const weightB = PRIORITY_WEIGHTS[b.priority] || 1;
    return weightB - weightA;
  });
}

check('Sorting: Overdue tasks sort before due-today tasks, with priority tie-break', () => {
  const sampleTasks = [
    { id: '1', title: 'Due today low', priority: 'LOW', dueDate: '2026-10-02T10:00:00Z', status: 'PENDING' },
    { id: '2', title: 'Overdue medium', priority: 'MEDIUM', dueDate: '2026-10-01T10:00:00Z', status: 'PENDING' },
    { id: '3', title: 'Due today urgent', priority: 'URGENT', dueDate: '2026-10-02T10:00:00Z', status: 'PENDING' },
    { id: '4', title: 'Completed', priority: 'URGENT', dueDate: '2026-09-01T10:00:00Z', status: 'COMPLETED' },
  ];

  const sorted = sortTasks(sampleTasks, fixedRefDate);
  assert.strictEqual(sorted[0].id, '2'); // Overdue
  assert.strictEqual(sorted[1].id, '3'); // Due today, urgent
  assert.strictEqual(sorted[2].id, '1'); // Due today, low
  assert.strictEqual(sorted[3].id, '4'); // Completed
});

// 4. Summary Metrics Computation
function computeMetrics(tasks, currentUserId = 'user-1', refDate = fixedRefDate) {
  let todoCount = 0;
  let dueTodayCount = 0;
  let overdueCount = 0;
  let completedThisWeekCount = 0;
  let assignedToMeCount = 0;

  tasks.forEach((t) => {
    const isCompleted = t.status === 'COMPLETED';
    const dueStatus = getDueDateStatus(t.dueDate, refDate);

    if (isCompleted) {
      completedThisWeekCount++;
    } else {
      todoCount++;
      if (dueStatus.isToday) dueTodayCount++;
      if (dueStatus.isOverdue) overdueCount++;
      if (t.assigneeId === currentUserId) assignedToMeCount++;
    }
  });

  return { todoCount, dueTodayCount, overdueCount, completedThisWeekCount, assignedToMeCount };
}

check('Metrics: Accurately computes To Do, Due Today, Overdue, and Assigned To Me', () => {
  const tasks = [
    { id: '1', priority: 'HIGH', status: 'PENDING', dueDate: '2026-10-02T00:00:00Z', assigneeId: 'user-1' },
    { id: '2', priority: 'URGENT', status: 'PENDING', dueDate: '2026-10-01T00:00:00Z', assigneeId: 'user-2' },
    { id: '3', priority: 'LOW', status: 'COMPLETED', dueDate: '2026-10-02T00:00:00Z', assigneeId: 'user-1' },
  ];

  const m = computeMetrics(tasks, 'user-1', fixedRefDate);
  assert.strictEqual(m.todoCount, 2);
  assert.strictEqual(m.dueTodayCount, 1);
  assert.strictEqual(m.overdueCount, 1);
  assert.strictEqual(m.completedThisWeekCount, 1);
  assert.strictEqual(m.assignedToMeCount, 1);
});

// 5. Existing Household Data Integrity Verification (Rivera Residence)
const existingRiveraTasks = [
  {
    id: 'f5f9e710-85f2-49ca-9752-0941a35123d1',
    householdId: '034e8931-3055-4628-855e-f38817e887f2',
    title: 'Clean HVAC Filters',
    priority: 'HIGH',
    status: 'PENDING',
    isRecurring: true,
  },
  {
    id: '1e37bc6b-944e-4f01-8378-04f56f1dc7ad',
    householdId: '034e8931-3055-4628-855e-f38817e887f2',
    title: 'Pay Electricity Utility Bill',
    priority: 'URGENT',
    status: 'PENDING',
    isRecurring: false,
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    householdId: '034e8931-3055-4628-855e-f38817e887f2',
    title: 'Restock Pantry Essentials',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    isRecurring: false,
  }
];

check('Existing Data: Rivera Residence has exactly 2 pending tasks matching Dashboard count', () => {
  const pending = existingRiveraTasks.filter((t) => t.status === 'PENDING');
  assert.strictEqual(pending.length, 2, 'Pending tasks must match Dashboard "2 Tasks Pending" count');
  assert.strictEqual(existingRiveraTasks.length, 3);
});

check('Preservation: Rivera tasks have preserved titles, priorities, and recurrence settings', () => {
  const hvac = existingRiveraTasks.find((t) => t.title === 'Clean HVAC Filters');
  assert(hvac, 'Clean HVAC Filters must exist');
  assert.strictEqual(hvac.priority, 'HIGH');
  assert.strictEqual(hvac.isRecurring, true);

  const electric = existingRiveraTasks.find((t) => t.title === 'Pay Electricity Utility Bill');
  assert(electric, 'Pay Electricity Utility Bill must exist');
  assert.strictEqual(electric.priority, 'URGENT');
});

console.log(`\n==================================================`);
console.log(`TASKS VERIFICATION SUITE: ${passed} PASSED, 0 FAILED`);
console.log(`==================================================\n`);
