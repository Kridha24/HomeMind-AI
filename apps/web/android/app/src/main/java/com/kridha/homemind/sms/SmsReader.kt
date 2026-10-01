package com.kridha.homemind.sms

import android.content.Context
import android.provider.Telephony

object SmsReader {

    /**
     * Reads recent inbox SMS messages from Android Telephony provider and parses financial transactions.
     * Respects `sinceTimestamp` to avoid re-reading previously processed messages.
     */
    fun scanFinancialInbox(
        context: Context,
        sinceTimestamp: Long = 0L,
        limit: Int = 100
    ): List<ParsedSmsTransaction> {
        val results = mutableListOf<ParsedSmsTransaction>()

        val projection = arrayOf(
            Telephony.Sms.ADDRESS,
            Telephony.Sms.BODY,
            Telephony.Sms.DATE
        )

        val selection = if (sinceTimestamp > 0) {
            "${Telephony.Sms.DATE} > ?"
        } else {
            null
        }

        val selectionArgs = if (sinceTimestamp > 0) {
            arrayOf(sinceTimestamp.toString())
        } else {
            null
        }

        val sortOrder = "${Telephony.Sms.DATE} DESC LIMIT $limit"

        try {
            val cursor = context.contentResolver.query(
                Telephony.Sms.Inbox.CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                sortOrder
            )

            cursor?.use {
                val addressIdx = it.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
                val bodyIdx = it.getColumnIndexOrThrow(Telephony.Sms.BODY)
                val dateIdx = it.getColumnIndexOrThrow(Telephony.Sms.DATE)

                while (it.moveToNext()) {
                    val address = it.getString(addressIdx) ?: ""
                    val body = it.getString(bodyIdx) ?: ""
                    val date = it.getLong(dateIdx)

                    if (FinancialSmsFilter.isFinancial(address, body)) {
                        val parsed = BankSmsParser.parse(address, body, date)
                        if (parsed != null && parsed.confidence >= 0.50) {
                            results.add(parsed)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return results
    }
}
