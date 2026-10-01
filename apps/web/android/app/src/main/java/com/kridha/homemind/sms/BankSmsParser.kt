package com.kridha.homemind.sms

import java.util.regex.Pattern

interface SmsTransactionParser {
    fun canParse(sender: String, body: String): Boolean
    fun parse(sender: String, body: String, timestamp: Long): ParsedSmsTransaction?
}

object BankSmsParser {

    private val parsers = listOf(
        UpiParser(),
        GenericBankParser()
    )

    fun parse(sender: String, body: String, timestamp: Long): ParsedSmsTransaction? {
        if (!FinancialSmsFilter.isFinancial(sender, body)) {
            return null
        }

        for (parser in parsers) {
            if (parser.canParse(sender, body)) {
                val result = parser.parse(sender, body, timestamp)
                if (result != null && result.amount > 0) {
                    return result
                }
            }
        }

        return null
    }

    /**
     * Deduces readable bank name from SMS sender address (e.g., "VM-HDFCBK" -> "HDFC Bank")
     */
    fun deduceBankName(sender: String): String? {
        val clean = sender.uppercase()
        return when {
            clean.contains("HDFC") -> "HDFC Bank"
            clean.contains("SBI") -> "State Bank of India"
            clean.contains("ICICI") -> "ICICI Bank"
            clean.contains("AXIS") -> "Axis Bank"
            clean.contains("KOTAK") -> "Kotak Mahindra Bank"
            clean.contains("BOB") || clean.contains("BARODA") -> "Bank of Baroda"
            clean.contains("PNB") -> "Punjab National Bank"
            clean.contains("CANARA") -> "Canara Bank"
            clean.contains("UNION") -> "Union Bank"
            clean.contains("YES") -> "Yes Bank"
            clean.contains("IDFC") -> "IDFC First Bank"
            clean.contains("INDUS") -> "IndusInd Bank"
            clean.contains("PAYTM") -> "Paytm Payments Bank"
            clean.contains("FEDRL") -> "Federal Bank"
            clean.contains("CITI") -> "Citi Bank"
            clean.contains("SCB") || clean.contains("STANCHAR") -> "Standard Chartered"
            else -> null
        }
    }
}

class UpiParser : SmsTransactionParser {

    private val amountRegex = Pattern.compile("(?i)(?:rs\\.?|inr|₹)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)")
    private val vpaRegex = Pattern.compile("(?i)(?:to|vpa|transfer\\s*to|at)\\s+([a-zA-Z0-9._-]+@[a-zA-Z0-9]+)")
    private val merchantFallbackRegex = Pattern.compile("(?i)(?:to|vpa|paid\\s*to)\\s+([a-zA-Z0-9\\s&._-]{2,30}?)(?=\\s+via|\\s+ref|\\s+on|\\s+dated|\\.|$)")
    private val refRegex = Pattern.compile("(?i)(?:upi\\s*ref(?:erence)?(?:\\s*no)?|ref(?:\\s*no)?|rrn|txn\\s*id)\\s*[:.]?\\s*([a-zA-Z0-9]{6,16})")
    private val accountRegex = Pattern.compile("(?i)(?:a/c|account|acct)\\s*(?:no\\.?)?\\s*(?:ending\\s*)?[x*X\\s]*([0-9]{3,4})")

    override fun canParse(sender: String, body: String): Boolean {
        val lower = body.lowercase()
        return lower.contains("upi") || lower.contains("vpa")
    }

    override fun parse(sender: String, body: String, timestamp: Long): ParsedSmsTransaction? {
        val lower = body.lowercase()

        // 1. Amount
        val amountMatcher = amountRegex.matcher(body)
        if (!amountMatcher.find()) return null
        val amountStr = amountMatcher.group(1)?.replace(",", "") ?: return null
        val amount = amountStr.toDoubleOrNull() ?: return null

        // 2. Type
        val isCredit = lower.contains("credited") || lower.contains("received") || lower.contains("refund")
        val isDebit = lower.contains("debited") || lower.contains("paid") || lower.contains("spent") || lower.contains("withdrawn") || lower.contains("sent")
        val type = if (isCredit && !isDebit) "CREDIT" else "DEBIT"

        // 3. Merchant / VPA
        var merchant: String? = null
        val vpaMatcher = vpaRegex.matcher(body)
        if (vpaMatcher.find()) {
            merchant = vpaMatcher.group(1)?.trim()
        } else {
            val merchantMatcher = merchantFallbackRegex.matcher(body)
            if (merchantMatcher.find()) {
                val candidate = merchantMatcher.group(1)?.trim()
                if (!candidate.isNullOrBlank() && !candidate.equals("upi", ignoreCase = true) && candidate.length < 35) {
                    merchant = candidate
                }
            }
        }

        // Clean up VPA handle if needed: e.g. "zomato@upi" -> "ZOMATO"
        val cleanMerchant = merchant?.let {
            if (it.contains("@")) it.split("@")[0].uppercase() else it.trim()
        }

        // 4. Account
        val accountMatcher = accountRegex.matcher(body)
        val accountLast4 = if (accountMatcher.find()) accountMatcher.group(1) else null

        // 5. Reference
        val refMatcher = refRegex.matcher(body)
        val reference = if (refMatcher.find()) refMatcher.group(1) else null

        // 6. Bank Name
        val bankName = BankSmsParser.deduceBankName(sender)

        // 7. Confidence Score
        var confidence = 0.30 // amount found
        if (isDebit || isCredit) confidence += 0.25
        if (bankName != null) confidence += 0.10
        if (reference != null) confidence += 0.10
        if (accountLast4 != null) confidence += 0.10
        confidence += 0.10 // payment method (UPI) confirmed
        if (cleanMerchant != null) confidence += 0.05
        confidence = confidence.coerceAtMost(1.0)

        val sourceHash = ParsedSmsTransaction.computeSourceHash(
            sender, amount, type, reference, accountLast4, timestamp
        )

        return ParsedSmsTransaction(
            amount = amount,
            currency = "INR",
            type = type,
            merchant = cleanMerchant,
            category = null,
            paymentMethod = "UPI",
            accountLast4 = accountLast4,
            bankName = bankName,
            reference = reference,
            occurredAt = ParsedSmsTransaction.formatIsoDate(timestamp),
            sourceHash = sourceHash,
            rawSender = sender,
            confidence = confidence
        )
    }
}

class GenericBankParser : SmsTransactionParser {

    private val amountRegex = Pattern.compile("(?i)(?:rs\\.?|inr|₹)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)")
    private val accountRegex = Pattern.compile("(?i)(?:a/c|account|acct|card)\\s*(?:no\\.?)?\\s*(?:ending\\s*)?[x*X\\s]*([0-9]{3,4})")
    private val refRegex = Pattern.compile("(?i)(?:ref(?:\\s*no)?|rrn|txn(?:\\s*id)?|reference|neft\\s*ref)\\s*[:.]?\\s*([a-zA-Z0-9]{6,18})")
    private val merchantRegex = Pattern.compile("(?i)(?:at|to|info\\s*:)\\s+([a-zA-Z0-9\\s&._-]{2,30}?)(?=\\s+on|\\s+avl|\\s+ref|\\s+dated|\\.|\\n|$)")

    override fun canParse(sender: String, body: String): Boolean = true

    override fun parse(sender: String, body: String, timestamp: Long): ParsedSmsTransaction? {
        val lower = body.lowercase()

        // 1. Amount
        val amountMatcher = amountRegex.matcher(body)
        if (!amountMatcher.find()) return null
        val amountStr = amountMatcher.group(1)?.replace(",", "") ?: return null
        val amount = amountStr.toDoubleOrNull() ?: return null

        // 2. Type
        val isCredit = lower.contains("credited") || lower.contains("received") || lower.contains("deposited") || lower.contains("refund")
        val isDebit = lower.contains("debited") || lower.contains("spent") || lower.contains("paid") || lower.contains("withdrawn") || lower.contains("purchase")
        if (!isCredit && !isDebit) return null
        val type = if (isCredit && !isDebit) "CREDIT" else "DEBIT"

        // 3. Payment Method detection
        val paymentMethod = when {
            lower.contains("upi") || lower.contains("vpa") -> "UPI"
            lower.contains("neft") -> "NEFT"
            lower.contains("imps") -> "IMPS"
            lower.contains("rtgs") -> "RTGS"
            lower.contains("atm") -> "ATM"
            lower.contains("card") || lower.contains("pos") -> "CARD"
            else -> "BANK"
        }

        // 4. Account
        val accountMatcher = accountRegex.matcher(body)
        val accountLast4 = if (accountMatcher.find()) accountMatcher.group(1) else null

        // 5. Reference
        val refMatcher = refRegex.matcher(body)
        val reference = if (refMatcher.find()) refMatcher.group(1) else null

        // 6. Merchant
        val merchantMatcher = merchantRegex.matcher(body)
        var merchant: String? = null
        if (merchantMatcher.find()) {
            val candidate = merchantMatcher.group(1)?.trim()
            if (!candidate.isNullOrBlank() && candidate.length < 35 && !candidate.equals("upi", ignoreCase = true)) {
                merchant = candidate
            }
        }

        // 7. Bank Name
        val bankName = BankSmsParser.deduceBankName(sender)

        // 8. Confidence Score
        var confidence = 0.30 // amount
        confidence += 0.25 // debit or credit
        if (bankName != null) confidence += 0.10
        if (reference != null) confidence += 0.10
        if (accountLast4 != null) confidence += 0.10
        if (paymentMethod != "BANK") confidence += 0.10
        if (merchant != null) confidence += 0.05
        confidence = confidence.coerceAtMost(1.0)

        val sourceHash = ParsedSmsTransaction.computeSourceHash(
            sender, amount, type, reference, accountLast4, timestamp
        )

        return ParsedSmsTransaction(
            amount = amount,
            currency = "INR",
            type = type,
            merchant = merchant,
            category = null,
            paymentMethod = paymentMethod,
            accountLast4 = accountLast4,
            bankName = bankName,
            reference = reference,
            occurredAt = ParsedSmsTransaction.formatIsoDate(timestamp),
            sourceHash = sourceHash,
            rawSender = sender,
            confidence = confidence
        )
    }
}
