package com.kridha.homemind.sms

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object TransactionStore {
    fun storeInPendingQueue(context: Context, tx: ParsedSmsTransaction) {
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
