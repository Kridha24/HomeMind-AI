import assert from 'assert';
import { SemanticParser } from '../modules/copilot/semanticParser';
import { IntentExtractor } from '../modules/copilot/intentExtractor';

async function testPhrases() {
  console.log('Testing specific requested phrases...');

  const members = [{ id: 'user-1', name: 'Rahul Sharma' }];

  // 1. "500 rs add krdo breakfast kiya tha"
  const q1 = SemanticParser.route('500 rs add krdo breakfast kiya tha', members);
  console.log('Q1 (breakfast):', q1.intent?.tool, q1.intent?.args);
  assert.strictEqual(q1.intent?.tool, 'createExpense');
  assert.strictEqual(q1.intent?.args.amount, 500);
  assert.strictEqual(q1.intent?.args.category, 'Food & Dining');

  // 2. "2k mummy ne diye"
  const q2 = SemanticParser.route('2k mummy ne diye', members);
  console.log('Q2 (mummy):', q2.intent?.tool, q2.intent?.args);
  assert.strictEqual(q2.intent?.tool, 'createIncome');
  assert.strictEqual(q2.intent?.args.amount, 2000);

  // 3. "milk bread and eggs khatam hain"
  const q3 = SemanticParser.route('milk bread and eggs khatam hain', members);
  console.log('Q3 (groceries):', q3.intent?.tool, q3.intent?.args);
  assert.strictEqual(q3.intent?.tool, 'addGroceryItem');
  assert.strictEqual(q3.intent?.args.items?.length, 3);

  // 4. "kal cylinder lena hai"
  const q4 = SemanticParser.route('kal cylinder lena hai', members);
  console.log('Q4 (cylinder):', q4.intent?.tool, q4.intent?.args);
  assert.strictEqual(q4.intent?.tool, 'createTask');

  // 5. "PG rent paid mark kro"
  const q5 = SemanticParser.route('PG rent paid mark kro', members);
  console.log('Q5 (PG rent paid):', q5.intent?.tool, q5.intent?.args);
  assert.strictEqual(q5.intent?.tool, 'markBillPaid');

  // 6. "is month kitna kharcha hua"
  const q6 = SemanticParser.route('is month kitna kharcha hua', members);
  console.log('Q6 (read-only query):', q6.intent?.tool, q6.intent?.args);
  assert.strictEqual(q6.intent?.tool, 'getFinanceSummary');

  // 7. "100 gift add krdo"
  const q7 = SemanticParser.route('100 gift add krdo', members);
  console.log('Q7 (ambiguity):', q7.intent?.tool, q7.intent?.isAmbiguous, q7.intent?.clarificationQuestion);
  assert.strictEqual(q7.intent?.isAmbiguous, true);
  assert(q7.intent?.clarificationQuestion?.includes('gift'));

  // 8. "milk add kro aur kal gas cylinder ka task bana do"
  const compound = IntentExtractor.splitCompoundActions('milk add kro aur kal gas cylinder ka task bana do');
  console.log('Q8 compound parts:', compound);
  assert.strictEqual(compound.length, 2);
  const q8a = SemanticParser.route(compound[0], members);
  const q8b = SemanticParser.route(compound[1], members);
  console.log('Q8a:', q8a.intent?.tool, 'Q8b:', q8b.intent?.tool);
  assert.strictEqual(q8a.intent?.tool, 'addGroceryItem');
  assert.strictEqual(q8b.intent?.tool, 'createTask');

  console.log('\n🎉 ALL 8 ACCEPTANCE PHRASES PASSED PERFECTLY!');
}

testPhrases().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
