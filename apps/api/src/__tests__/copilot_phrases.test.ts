import assert from 'assert';
import { SemanticParser } from '../modules/copilot/semanticParser';
import { IntentExtractor } from '../modules/copilot/intentExtractor';
import { CopilotService } from '../modules/copilot/copilot.service';

async function testPhrases() {
  console.log('🧪 Starting Conversational Copilot Verification Test Suite...\n');

  const members = [{ id: 'user-1', name: 'Rahul Sharma' }];

  // =========================================================================
  // 1. SMALL TALK SUITE
  // =========================================================================
  console.log('--- 1. Testing Small Talk Detection ---');
  const smallTalkInputs = [
    { input: 'Hello', expectReply: true },
    { input: 'hey there', expectReply: true },
    { input: 'kaise ho?', expectReply: true },
    { input: 'how are you doing today', expectReply: true },
    { input: 'thank you so much', expectReply: true },
    { input: 'shukriya', expectReply: true },
    { input: 'what can you do', expectReply: true },
    { input: 'tum kaun ho', expectReply: true },
    { input: '500 breakfast pe kharch hua', expectReply: false },
    { input: 'milk add kar do', expectReply: false },
  ];

  for (const item of smallTalkInputs) {
    const res = CopilotService.detectSmallTalk(item.input);
    assert.strictEqual(
      res.isSmallTalk,
      item.expectReply,
      `Expected isSmallTalk=${item.expectReply} for "${item.input}"`
    );
    if (item.expectReply) {
      assert(res.reply && res.reply.length > 10, `Reply too short for "${item.input}"`);
      assert(res.suggestions && res.suggestions.length > 0, `Suggestions missing for "${item.input}"`);
    }
  }
  console.log('  ✅ PASS: Small talk & greetings detected cleanly\n');

  // =========================================================================
  // 2. ENGLISH PHRASES
  // =========================================================================
  console.log('--- 2. Testing English Phrases ---');

  // "Add 500 for breakfast"
  const e1 = SemanticParser.route('Add 500 for breakfast', members);
  assert.strictEqual(e1.intent?.tool, 'createExpense');
  assert.strictEqual(e1.intent?.args.amount, 500);
  assert.strictEqual(e1.intent?.args.category, 'Food & Dining');

  // "Add 2000 income from mom"
  const e2 = SemanticParser.route('Add 2000 income from mom', members);
  assert.strictEqual(e2.intent?.tool, 'createIncome');
  assert.strictEqual(e2.intent?.args.amount, 2000);
  assert.strictEqual(e2.intent?.args.source, 'Family');

  // "Add milk and bread to groceries"
  const e3 = SemanticParser.route('Add milk and bread to groceries', members);
  assert.strictEqual(e3.intent?.tool, 'addGroceryItem');
  assert.strictEqual(e3.intent?.args.items?.length, 2);
  assert.strictEqual(e3.intent?.args.items[0].name, 'Milk');
  assert.strictEqual(e3.intent?.args.items[1].name, 'Bread');

  // "Show my pending tasks"
  const e4 = SemanticParser.route('Show my pending tasks', members);
  assert.strictEqual(e4.intent?.tool, 'getTasks');
  assert.strictEqual(e4.intent?.args.status, 'PENDING');

  console.log('  ✅ PASS: English phrases routed accurately\n');

  // =========================================================================
  // 3. HINDI PHRASES
  // =========================================================================
  console.log('--- 3. Testing Hindi Phrases ---');

  // "500 breakfast par kharch hua"
  const h1 = SemanticParser.route('500 breakfast par kharch hua', members);
  assert.strictEqual(h1.intent?.tool, 'createExpense');
  assert.strictEqual(h1.intent?.args.amount, 500);
  assert.strictEqual(h1.intent?.args.category, 'Food & Dining');

  // "2 hazaar mummy ne diye"
  const h2 = SemanticParser.route('2 hazaar mummy ne diye', members);
  assert.strictEqual(h2.intent?.tool, 'createIncome');
  assert.strictEqual(h2.intent?.args.amount, 2000);
  assert.strictEqual(h2.intent?.args.source, 'Family');

  // "doodh khatam ho gaya"
  const h3 = SemanticParser.route('doodh khatam ho gaya', members);
  assert.strictEqual(h3.intent?.tool, 'addGroceryItem');
  assert.strictEqual(h3.intent?.args.items?.[0]?.name, 'Milk');

  // "kal bijli ka bill bharna hai"
  const h4 = SemanticParser.route('kal bijli ka bill bharna hai', members);
  assert.strictEqual(h4.intent?.tool, 'createTask');
  assert(h4.intent?.args.dueDate, 'Due date should be parsed');

  console.log('  ✅ PASS: Hindi phrases routed accurately\n');

  // =========================================================================
  // 4. HINGLISH PHRASES
  // =========================================================================
  console.log('--- 4. Testing Hinglish Phrases ---');

  // "500 rs add krdo breakfast kiya tha"
  const hg1 = SemanticParser.route('500 rs add krdo breakfast kiya tha', members);
  assert.strictEqual(hg1.intent?.tool, 'createExpense');
  assert.strictEqual(hg1.intent?.args.amount, 500);

  // "2k mummy ne diye"
  const hg2 = SemanticParser.route('2k mummy ne diye', members);
  assert.strictEqual(hg2.intent?.tool, 'createIncome');
  assert.strictEqual(hg2.intent?.args.amount, 2000);

  // "milk bread eggs khatam hain"
  const hg3 = SemanticParser.route('milk bread eggs khatam hain', members);
  assert.strictEqual(hg3.intent?.tool, 'addGroceryItem');
  assert.strictEqual(hg3.intent?.args.items?.length, 3);

  // "is month kitna kharcha hua?"
  const hg4 = SemanticParser.route('is month kitna kharcha hua?', members);
  assert.strictEqual(hg4.intent?.tool, 'getFinanceSummary');

  // "actually 500 nahi 450 tha"
  const prevExp = { tool: 'createExpense' as const, entityId: 'exp-99', amount: 500 };
  const hg5 = SemanticParser.route('actually 500 nahi 450 tha', members, prevExp);
  assert.strictEqual(hg5.intent?.tool, 'updateExpense');
  assert.strictEqual(hg5.intent?.args.id, 'exp-99');
  assert.strictEqual(hg5.intent?.args.amount, 450);

  // "100 gift add kar do" (Ambiguity clarification)
  const hg6 = SemanticParser.route('100 gift add kar do', members);
  assert.strictEqual(hg6.intent?.isAmbiguous, true);
  assert(hg6.intent?.clarificationQuestion?.includes('gift'));
  assert.strictEqual(hg6.intent?.clarificationOptions?.length, 2);

  console.log('  ✅ PASS: Hinglish phrases & clarification flows routed accurately\n');

  // =========================================================================
  // 5. COMPOUND PHRASE SUITE
  // =========================================================================
  console.log('--- 5. Testing Compound Multi-Action Phrases ---');
  const compound = IntentExtractor.splitCompoundActions('milk add kro aur kal gas cylinder ka task bana do');
  assert.strictEqual(compound.length, 2);
  const q8a = SemanticParser.route(compound[0], members);
  const q8b = SemanticParser.route(compound[1], members);
  assert.strictEqual(q8a.intent?.tool, 'addGroceryItem');
  assert.strictEqual(q8b.intent?.tool, 'createTask');
  console.log('  ✅ PASS: Compound actions split and routed cleanly\n');

  console.log('🎉 ALL CONVERSATIONAL ACCEPTANCE TESTS PASSED PERFECTLY!\n');
}

testPhrases().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
