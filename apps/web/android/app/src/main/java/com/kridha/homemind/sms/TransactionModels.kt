package com.kridha.homemind.sms

import com.getcapacitor.JSObject
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

data class ParsedSmsTransaction(
    val amount: Double,
    val currency: String = "INR",
    val type: String, // "DEBIT" or "CREDIT"
    val merchant: String? = null,
    val category: String? = null,
    val paymentMethod: String? = null, // "UPI", "CARD", "IMPS", "NEFT", "RTGS", "ATM", "BANK"
    val accountLast4: String? = null,
    val bankName: String? = null,
    val reference: String? = null,
    val occurredAt: String, // ISO-8601 string
    val sourceHash: String,
    val rawSender: String? = null,
    val confidence: Double = 0.0
) {
    fun toJSObject(): JSObject {
        val obj = JSObject()
        obj.put("amount", amount)
        obj.put("currency", currency)
        obj.put("type", type)
        obj.put("merchant", merchant)
        obj.put("category", category)
        obj.put("paymentMethod", paymentMethod)
        obj.put("accountLast4", accountLast4)
        obj.put("bankName", bankName)
        obj.put("reference", reference)
        obj.put("occurredAt", occurredAt)
        obj.put("sourceHash", sourceHash)
        obj.put("rawSender", rawSender)
        obj.put("parserConfidence", confidence)
        return obj
    }

    companion object {
        fun computeSourceHash(
            sender: String?,
            amount: Double,
            type: String,
            reference: String?,
            accountLast4: String?,
            timestampMs: Long
        ): String {
            val normalizedSender = (sender ?: "UNKNOWN").trim().uppercase().replace(Regex("[^A-Z0-9]"), "")
            val normalizedAmount = String.format(Locale.US, "%.2f", amount)
            val normalizedType = type.trim().uppercase()
            val normalizedAccount = (accountLast4 ?: "").trim().replace(Regex("[^0-9]"), "")
            val ref = (reference ?: "").trim().uppercase().replace(Regex("[^A-Z0-9]"), "")

            val datePart = if (ref.length >= 4) {
                val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                sdf.format(Date(timestampMs))
            } else {
                val bucket = timestampMs / (5 * 60 * 1000)
                "B_$bucket"
            }

            val raw = listOf(normalizedSender, normalizedAmount, normalizedType, ref, normalizedAccount, datePart).joinToString("|")
            val bytes = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray(Charsets.UTF_8))
            return bytes.joinToString("") { "%02x".format(it) }
        }

        fun formatIsoDate(timestampMs: Long): String {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            return sdf.format(Date(timestampMs))
        }
    }
}
