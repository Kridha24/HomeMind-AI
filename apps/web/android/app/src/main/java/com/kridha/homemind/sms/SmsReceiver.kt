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
            TransactionStore.storeInPendingQueue(context, parsed)

            // 2. Notify active Capacitor plugin listener if app is running in foreground
            HomeMindSmsPlugin.notifyNewTransaction(parsed)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
