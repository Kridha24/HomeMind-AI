import { parserRegistry } from '../parsers';
import { FinancialSmsFilter } from '../parsers/financialFilter';

export async function runParserTests() {
  console.log('🧪 Starting SMS Parser Engine & Privacy Filter Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Privacy filter tests
  const otpSms = 'Your OTP for login to HomeMind AI is 482910. Valid for 5 minutes. Do not share.';
  assert('Privacy: Reject standard login OTP messages', !FinancialSmsFilter.isFinancial('VM-HOMEMD', otpSms));
  assert('Privacy: Parser returns null on login OTP', parserRegistry.parse('VM-HOMEMD', otpSms) === null);

  const mktSms = 'Big Sale! Get flat 50% discount on orders above Rs. 1999. Use code MEGA50.';
  assert('Privacy: Reject marketing promotional text', !FinancialSmsFilter.isFinancial('AD-DISCNT', mktSms));

  const convoSms = 'Hey, are we still meeting for lunch today at 1pm?';
  assert('Privacy: Reject personal conversation message', !FinancialSmsFilter.isFinancial('9876543210', convoSms));

  // 2. Bank specific parser tests
  const hdfcDebit = 'Rs 1,450.00 debited from HDFC Bank A/C **1234 on 02-OCT-26 to Swiggy Ref 1234567890';
  const hdfcParsed = parserRegistry.parse('HDFCBK', hdfcDebit);
  assert(
    'HDFC Parser: Parse UPI debit (provider, amount, direction, ref, merchant)',
    hdfcParsed !== null &&
      hdfcParsed.provider === 'HDFC Bank' &&
      hdfcParsed.amount === 1450.0 &&
      hdfcParsed.direction === 'DEBIT' &&
      hdfcParsed.externalReference === '1234567890' &&
      hdfcParsed.merchant === 'Swiggy'
  );

  const hdfcCredit = 'Rs 5,000.00 credited to HDFC Bank A/C **1234 on 02-OCT-26 by info Ref 9876543210';
  const hdfcCreditParsed = parserRegistry.parse('HDFCBK', hdfcCredit);
  assert(
    'HDFC Parser: Parse credit / deposit',
    hdfcCreditParsed !== null &&
      hdfcCreditParsed.amount === 5000.0 &&
      hdfcCreditParsed.direction === 'CREDIT' &&
      hdfcCreditParsed.externalReference === '9876543210'
  );

  const iciciDebit = 'Acct XX987 debited for Rs 850.00 on 02-Oct-26. UPI:Swiggy@icici. Ref:9876543210';
  const iciciParsed = parserRegistry.parse('ICICIB', iciciDebit);
  assert(
    'ICICI Parser: Parse debit and account mask',
    iciciParsed !== null &&
      iciciParsed.provider === 'ICICI Bank' &&
      iciciParsed.amount === 850.0 &&
      iciciParsed.direction === 'DEBIT' &&
      iciciParsed.accountMasked === 'XX987'
  );

  const sbiDebit = 'Your A/C X4321 debited by Rs.2,400.00 on 02Oct26 transfer to Zomato Ref No 12345678';
  const sbiParsed = parserRegistry.parse('SBINB', sbiDebit);
  assert(
    'SBI Parser: Parse debit transfer',
    sbiParsed !== null &&
      sbiParsed.provider === 'State Bank of India' &&
      sbiParsed.amount === 2400.0 &&
      sbiParsed.merchant === 'Zomato'
  );

  const axisDebit = 'Axis Bank: INR 350.00 debited from A/c no. XX5678 on 02-10-26 at Uber. Ref: AXIS12345';
  const axisParsed = parserRegistry.parse('AXISBK', axisDebit);
  assert(
    'Axis Parser: Parse debit at merchant',
    axisParsed !== null &&
      axisParsed.provider === 'Axis Bank' &&
      axisParsed.amount === 350.0 &&
      axisParsed.merchant === 'Uber' &&
      axisParsed.externalReference === 'AXIS12345'
  );

  const genericUpi = 'Paid Rs. 199.00 to Netflix on 02-10-26 via UPI Ref 9988776655.';
  const upiParsed = parserRegistry.parse('UPIPAY', genericUpi);
  assert(
    'Generic UPI Parser: Parse debit payment',
    upiParsed !== null &&
      upiParsed.amount === 199.0 &&
      upiParsed.direction === 'DEBIT' &&
      upiParsed.merchant === 'Netflix'
  );

  const refundSms = 'Rs 75.00 refunded to your A/c XX1234 for cancelled order Ref 887766.';
  const refundParsed = parserRegistry.parse('HDFCBK', refundSms);
  assert(
    'Refund / Reversal: Parse as CREDIT',
    refundParsed !== null && refundParsed.amount === 75.0 && refundParsed.direction === 'CREDIT'
  );

  console.log(`\nParser Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  runParserTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
