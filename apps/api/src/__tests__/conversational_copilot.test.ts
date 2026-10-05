import assert from 'assert';
import { SemanticParser } from '../modules/copilot/semanticParser';
import { CopilotService } from '../modules/copilot/copilot.service';

async function runConversationalCopilotTests() {
  console.log('🚀 Running Provider-Independent Conversational Copilot Verification Tests...\n');

  const members = [{ id: 'user-1', name: 'Kridha' }];

  // =========================================================================
  // 1. CONVERSATIONAL SMALL TALK SUITE (ENGLISH, HINDI, HINGLISH)
  // =========================================================================
  console.log('--- 1. Conversational Small Talk Suite ---');

  // "hi"
  const hiRes = CopilotService.detectSmallTalk('hi');
  assert.strictEqual(hiRes.isSmallTalk, true, 'Must detect "hi" as small talk');
  assert(hiRes.reply && hiRes.reply.length > 5, 'Reply must be non-empty');
  console.log('  "hi" ->', hiRes.reply);

  // "how are you"
  const howAreYouRes = CopilotService.detectSmallTalk('how are you');
  assert.strictEqual(howAreYouRes.isSmallTalk, true, 'Must detect "how are you" as small talk');
  assert(howAreYouRes.reply && howAreYouRes.reply.includes('great'), 'Must return friendly English response');
  console.log('  "how are you" ->', howAreYouRes.reply);

  // "kaise ho bhai"
  const kaiseHoBhaiRes = CopilotService.detectSmallTalk('kaise ho bhai');
  assert.strictEqual(kaiseHoBhaiRes.isSmallTalk, true, 'Must detect "kaise ho bhai" as small talk');
  assert(kaiseHoBhaiRes.reply && kaiseHoBhaiRes.reply.includes('Badhiya'), 'Must return natural Hinglish response');
  console.log('  "kaise ho bhai" ->', kaiseHoBhaiRes.reply);

  // "can u talk normally"
  const normalTalkRes = CopilotService.detectSmallTalk('can u talk normally');
  assert.strictEqual(normalTalkRes.isSmallTalk, true, 'Must detect "can u talk normally" as small talk');
  assert(normalTalkRes.reply && normalTalkRes.reply.includes('normally'), 'Must reassure user to speak naturally');
  console.log('  "can u talk normally" ->', normalTalkRes.reply);

  // "thanks"
  const thanksRes = CopilotService.detectSmallTalk('thanks');
  assert.strictEqual(thanksRes.isSmallTalk, true, 'Must detect "thanks" as small talk');
  assert(thanksRes.reply && thanksRes.reply.includes('welcome'), 'Must return gratitude reply');
  console.log('  "thanks" ->', thanksRes.reply);

  // "आप क्या कर सकते हो?"
  const hindiCapRes = CopilotService.detectSmallTalk('आप क्या कर सकते हो?');
  assert.strictEqual(hindiCapRes.isSmallTalk, true, 'Must detect Hindi capability inquiry as small talk');
  console.log('  "आप क्या कर सकते हो?" ->', hindiCapRes.reply);

  // "aaj kaafi stress hai"
  const stressRes = CopilotService.detectSmallTalk('aaj kaafi stress hai');
  assert.strictEqual(stressRes.isSmallTalk, true, 'Must detect stress/empathy check as small talk');
  assert(stressRes.reply && stressRes.reply.includes('aaram'), 'Must return empathetic response');
  console.log('  "aaj kaafi stress hai" ->', stressRes.reply);

  console.log('  ✅ PASS: Conversational small talk verified\n');

  // =========================================================================
  // 2. ROUTING INTEGRATION (CONVERSATION VS ACTIONS)
  // =========================================================================
  console.log('--- 2. Routing Separation (Zero Leaks to Actions) ---');
  const chatPhrases = [
    'hi',
    'how are you',
    'kaise ho bhai',
    'can u talk normally',
    'thanks',
    'आप क्या कर सकते हो?',
    'aaj kaafi stress hai',
  ];

  for (const phrase of chatPhrases) {
    const route = SemanticParser.route(phrase, members);
    assert.strictEqual(
      route.intent,
      null,
      `Conversational phrase "${phrase}" must NOT trigger action intent`
    );
  }
  console.log('  ✅ PASS: Chat phrases correctly produce zero action side-effects\n');

  // =========================================================================
  // 3. ACTION ENGINE PRESERVATION
  // =========================================================================
  console.log('--- 3. Action Engine Precision Routing ---');

  // "500 breakfast pe kharch hua" -> createExpense
  const exp = SemanticParser.route('500 breakfast pe kharch hua', members);
  assert.strictEqual(exp.intent?.tool, 'createExpense');
  assert.strictEqual(exp.intent?.args.amount, 500);
  assert.strictEqual(exp.intent?.args.category, 'Food & Dining');

  // "2k mummy ne diye" -> createIncome
  const inc = SemanticParser.route('2k mummy ne diye', members);
  assert.strictEqual(inc.intent?.tool, 'createIncome');
  assert.strictEqual(inc.intent?.args.amount, 2000);
  assert.strictEqual(inc.intent?.args.source, 'Family');

  // "milk khatam hai" -> addGroceryItem
  const groc = SemanticParser.route('milk khatam hai', members);
  assert.strictEqual(groc.intent?.tool, 'addGroceryItem');
  assert.strictEqual(groc.intent?.args.items?.[0]?.name, 'Milk');

  // "kal cylinder lena hai" -> createTask
  const task = SemanticParser.route('kal cylinder lena hai', members);
  assert.strictEqual(task.intent?.tool, 'createTask');
  assert(task.intent?.args.dueDate, 'Due date must be parsed');

  // "PG rent paid mark kro" -> markBillPaid
  const bill = SemanticParser.route('PG rent paid mark kro', members);
  assert.strictEqual(bill.intent?.tool, 'markBillPaid');

  // "is month kitna kharcha hua?" -> getFinanceSummary
  const query = SemanticParser.route('is month kitna kharcha hua?', members);
  assert.strictEqual(query.intent?.tool, 'getFinanceSummary');

  // "100 gift add kro" -> clarification
  const amb = SemanticParser.route('100 gift add kro', members);
  assert.strictEqual(amb.intent?.isAmbiguous, true);
  assert(amb.intent?.clarificationQuestion);

  // "actually 500 tha" -> follow-up update
  const prevAction = { tool: 'createExpense' as const, entityId: 'exp-999', amount: 450 };
  const update = SemanticParser.route('actually 500 tha', members, prevAction);
  assert.strictEqual(update.intent?.tool, 'updateExpense');
  assert.strictEqual(update.intent?.args.id, 'exp-999');
  assert.strictEqual(update.intent?.args.amount, 500);

  console.log('  ✅ PASS: All Action Engine actions, queries, and follow-ups preserved\n');

  console.log('🎉 ALL CONVERSATIONAL COPILOT TESTS PASSED PERFECTLY!\n');
}

runConversationalCopilotTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
