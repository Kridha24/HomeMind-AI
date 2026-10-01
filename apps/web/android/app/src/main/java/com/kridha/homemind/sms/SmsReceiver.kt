package com.kridha.homemind.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import org.json.JSONArray
import org.json.JSONObject

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        try {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (messages.isNullOrEmpty()) return

            // Group parts by sender in case of multi-part messages
            val sender = messages[0].originatingAddress ?: "UNKNOWN"
            val timestamp = messages[0].timestampMillis

            val bodyBuilder = StringBuilder()
            for (msg in messages) {
                bodyBuilder.append(msg.messageBody)
            }
            val fullBody = bodyBuilder.toString()

            if (!FinancialSmsFilter.isFinancial(sender, fullBody)) return

            val parsed = BankSmsParser.parse(sender, fullBody, timestamp) ?: return

            // 1. Store in offline SharedPreferences pending queue so it's resilient if app is in background or offline
            storeInPendingQueue(context, parsed)

            // 2. Notify active Capacitor plugin listener if app is running in foreground
            HomeMindSmsPlugin.notifyNewTransaction(parsed)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun storeInPendingQueue(context: Context, tx: ParsedSmsTransaction) {
        try {
            val prefs = context.getSharedPreferences("homemind_sms_queue", Context.MODE_PRIVATE)
            val existingJson = prefs.getString("pending_txns", "[]") ?: "[]"
            val array = JSONArray(existingJson)

            // Check if already in queue by sourceHash
            for (i in 0 until array.length()) {
                val item = array.getJSONObject(i)
                if (item.optString("sourceHash") == tx.sourceHash) {
                    return // Duplicate already in local queue
                }
            }

            val txJson = JSONObject().apply {
                put("amount", tx.amount)
                put("currency", tx.currency)
                put("type", tx.type)
                put("merchant", tx.merchant)
                put("category", tx.category)
                put("paymentMethod", tx.paymentMethod)
                put("accountLast4", tx.accountLast4)
                put("bankName", tx.bankName)
                put("reference", tx.reference)
                put("occurredAt", tx.occurredAt)
                put("sourceHash", tx.sourceHash)
                put("rawSender", tx.rawSender)
                put("parserConfidence", tx.confidence)
            }

            array.put(txJson)
            prefs.edit().putString("pending_txns", array.toString()).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
