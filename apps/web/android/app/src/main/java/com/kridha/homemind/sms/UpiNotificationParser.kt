package com.kridha.homemind.sms

import java.util.Locale
import java.util.regex.Pattern

object UpiNotificationParser {

    private val PACKAGE_APP_MAP = mapOf(
        "com.phonepe.app" to "PhonePe",
        "com.google.android.apps.nbu.paisa.user" to "Google Pay",
        "net.one97.paytm" to "Paytm",
        "in.org.npci.upiapp" to "BHIM UPI",
        "com.dreamplug.androidapp" to "CRED",
        "in.amazon.mShop.android.shopping" to "Amazon Pay",
        "com.navi.finance" to "Navi",
        "com.tatadigital.tcp" to "Tata Neu",
        "org.slicepay" to "Slice",
        "money.jupiter" to "Jupiter",
        "money.fi" to "Fi Money"
    )

    fun isSupportedPackage(packageName: String): Boolean {
        return PACKAGE_APP_MAP.containsKey(packageName)
    }

    fun getAppName(packageName: String): String {
        return PACKAGE_APP_MAP[packageName] ?: "UPI App"
    }

    private val DEBIT_PATTERNS = listOf(
        Pattern.compile("""(?:paid|sent|payment of)\s*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:to|for)?\s*([a-zA-Z0-9\s&.'\-]+)""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:paid|sent|transferred)\s*(?:to|for)?\s*([a-zA-Z0-9\s&.'\-]+)""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""transferred\s*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:to)?\s*([a-zA-Z0-9\s&.'\-]+)""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""(?:successful|completed)\s*payment\s*of\s*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:to)?\s*([a-zA-Z0-9\s&.'\-]*)""", Pattern.CASE_INSENSITIVE)
    )

    private val CREDIT_PATTERNS = listOf(
        Pattern.compile("""(?:received|payment received of?)\s*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:from)?\s*([a-zA-Z0-9\s&.'\-]*)""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:received|credited)\s*(?:from)?\s*([a-zA-Z0-9\s&.'\-]*)""", Pattern.CASE_INSENSITIVE),
        Pattern.compile("""credited\s*(?:with)?\s*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:from)?\s*([a-zA-Z0-9\s&.'\-]*)""", Pattern.CASE_INSENSITIVE)
    )

    fun parse(packageName: String, title: String?, text: String?, subText: String?, timestampMs: Long): ParsedSmsTransaction? {
        val appName = getAppName(packageName)
        val combined = listOfNotNull(title, text, subText).joinToString(" ")
        if (combined.isBlank()) return null

        // 1. Try Debit patterns
        for (pattern in DEBIT_PATTERNS) {
            val matcher = pattern.matcher(combined)
            if (matcher.find()) {
                val amountStr = matcher.group(1)?.replace(",", "") ?: continue
                val amount = amountStr.toDoubleOrNull() ?: continue
                if (amount <= 0.0) continue

                var merchant = matcher.group(2)?.trim()?.replace(Regex("""(?i)\s*(via|using|from|successful|completed|ref|upi).*"""), "")?.trim()
                if (merchant.isNullOrBlank() || merchant.length < 2) {
                    merchant = title?.trim() ?: appName
                }
                if (merchant.equals("successful", ignoreCase = true) || merchant.equals("completed", ignoreCase = true)) {
                    merchant = appName
                }

                val occurredAt = ParsedSmsTransaction.formatIsoDate(timestampMs)
                val sourceHash = ParsedSmsTransaction.computeSourceHash(appName, amount, "DEBIT", null, null, timestampMs)

                return ParsedSmsTransaction(
                    amount = amount,
                    currency = "INR",
                    type = "DEBIT",
                    merchant = merchant.take(40),
                    category = categorize(merchant),
                    paymentMethod = "UPI",
                    accountLast4 = null,
                    bankName = appName,
                    reference = null,
                    occurredAt = occurredAt,
                    sourceHash = sourceHash,
                    rawSender = appName,
                    confidence = 0.95
                )
            }
        }

        // 2. Try Credit patterns
        for (pattern in CREDIT_PATTERNS) {
            val matcher = pattern.matcher(combined)
            if (matcher.find()) {
                val amountStr = matcher.group(1)?.replace(",", "") ?: continue
                val amount = amountStr.toDoubleOrNull() ?: continue
                if (amount <= 0.0) continue

                var sender = matcher.group(2)?.trim()?.replace(Regex("""(?i)\s*(via|using|in|successful|completed|ref|upi).*"""), "")?.trim()
                if (sender.isNullOrBlank() || sender.length < 2) {
                    sender = title?.trim() ?: "UPI Credit"
                }

                val occurredAt = ParsedSmsTransaction.formatIsoDate(timestampMs)
                val sourceHash = ParsedSmsTransaction.computeSourceHash(appName, amount, "CREDIT", null, null, timestampMs)

                return ParsedSmsTransaction(
                    amount = amount,
                    currency = "INR",
                    type = "CREDIT",
                    merchant = sender.take(40),
                    category = "Income",
                    paymentMethod = "UPI",
                    accountLast4 = null,
                    bankName = appName,
                    reference = null,
                    occurredAt = occurredAt,
                    sourceHash = sourceHash,
                    rawSender = appName,
                    confidence = 0.95
                )
            }
        }

        return null
    }

    private fun categorize(merchant: String?): String {
        val m = (merchant ?: "").lowercase(Locale.US)
        return when {
            m.contains("swiggy") || m.contains("zomato") || m.contains("eats") || m.contains("food") || m.contains("cafe") || m.contains("restaurant") || m.contains("chai") -> "Food & Dining"
            m.contains("blinkit") || m.contains("zepto") || m.contains("instamart") || m.contains("kirana") || m.contains("mart") || m.contains("grocery") || m.contains("store") -> "Groceries"
            m.contains("uber") || m.contains("ola") || m.contains("rapido") || m.contains("metro") || m.contains("fuel") || m.contains("petrol") -> "Transportation"
            m.contains("electricity") || m.contains("bescom") || m.contains("water") || m.contains("gas") || m.contains("broadband") || m.contains("recharge") || m.contains("bill") -> "Utilities"
            m.contains("amazon") || m.contains("flipkart") || m.contains("myntra") || m.contains("nykaa") -> "Shopping"
            m.contains("pharmacy") || m.contains("med") || m.contains("1mg") || m.contains("apollo") || m.contains("hospital") || m.contains("clinic") -> "Healthcare"
            else -> "Other"
        }
    }
}
