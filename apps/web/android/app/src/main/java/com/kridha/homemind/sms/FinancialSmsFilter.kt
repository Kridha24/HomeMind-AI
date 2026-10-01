package com.kridha.homemind.sms

object FinancialSmsFilter {

    private val REJECT_PATTERNS = listOf(
        Regex("(?i)\\b(otp|one\\s*time\\s*password|verification\\s*code|secret\\s*code|security\\s*code|login\\s*code|auth\\s*code)\\b"),
        Regex("(?i)\\b(do\\s*not\\s*share|never\\s*share|valid\\s*for\\s*\\d+\\s*min)\\b"),
        Regex("(?i)\\b(pre-?approved|apply\\s*now|claim\\s*your|congratulations|lucky\\s*draw|win\\s*cash|discount\\s*coupon)\\b"),
        Regex("(?i)\\b(loan\\s*offer|credit\\s*card\\s*offer|instant\\s*loan|personal\\s*loan)\\b")
    )

    private val DEBIT_KEYWORDS = listOf(
        "debited", "debit", "spent", "paid", "withdrawn", "purchase", "deducted", "sent to", "transferred to", "txn"
    )

    private val CREDIT_KEYWORDS = listOf(
        "credited", "credit", "received", "deposited", "refund", "added to", "salary", "cashback received"
    )

    private val FINANCIAL_INDICATORS = listOf(
        "a/c", "acct", "account", "vpa", "upi", "imps", "neft", "rtgs", "atm", "pos", "card",
        "inr", "rs", "rs.", "₹", "ref no", "reference", "avl bal", "balance", "txn"
    )

    /**
     * Quickly determines whether a message should be processed by the bank parser.
     */
    fun isFinancial(sender: String?, body: String?): Boolean {
        if (body.isNullOrBlank()) return false

        if (sender != null) {
            val upperSender = sender.uppercase()
            if (upperSender.contains("PROMO") || upperSender.contains("OFFER")) return false
        }

        val lowerBody = body.lowercase()

        // 1. Immediately reject OTP and promotional spam
        for (pattern in REJECT_PATTERNS) {
            if (pattern.containsMatchIn(lowerBody)) {
                return false
            }
        }

        // 2. Must contain an amount/currency indicator
        val hasCurrency = lowerBody.contains("rs") || lowerBody.contains("inr") || lowerBody.contains("₹")
        if (!hasCurrency) return false

        // 3. Must have a debit or credit action
        val hasDebit = DEBIT_KEYWORDS.any { lowerBody.contains(it) }
        val hasCredit = CREDIT_KEYWORDS.any { lowerBody.contains(it) }
        if (!hasDebit && !hasCredit) return false

        // 4. Must have an account or banking indicator
        val hasFinancialContext = FINANCIAL_INDICATORS.any { lowerBody.contains(it) }
        return hasFinancialContext
    }

    /**
     * Compute a deterministic confidence score (0.0 to 1.0) for how likely an SMS is a valid transaction.
     */
    fun calculateFilterScore(sender: String?, body: String?): Double {
        if (!isFinancial(sender, body)) return 0.0

        var score = 0.40
        val lowerBody = body!!.lowercase()

        if (DEBIT_KEYWORDS.any { lowerBody.contains(it) } || CREDIT_KEYWORDS.any { lowerBody.contains(it) }) {
            score += 0.20
        }
        if (lowerBody.contains("ref") || lowerBody.contains("txn") || lowerBody.contains("rrn")) {
            score += 0.15
        }
        if (lowerBody.contains("a/c") || lowerBody.contains("acct") || lowerBody.contains("account") || lowerBody.contains("card")) {
            score += 0.15
        }
        if (sender != null && isFinancialSender(sender)) {
            score += 0.10
        }

        return score.coerceAtMost(1.0)
    }

    private fun isFinancialSender(sender: String): Boolean {
        val clean = sender.uppercase()
        val bankSenders = listOf(
            "HDFC", "SBI", "ICICI", "AXIS", "KOTAK", "BOB", "PNB", "CANARA",
            "UNIONB", "YESB", "IDFC", "INDUS", "PAYTM", "FEDRL", "SCB", "CITI"
        )
        return bankSenders.any { clean.contains(it) }
    }
}
