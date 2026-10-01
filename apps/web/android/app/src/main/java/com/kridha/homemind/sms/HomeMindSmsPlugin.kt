package com.kridha.homemind.sms

import android.Manifest
import android.content.Context
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.PermissionState
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import org.json.JSONArray

@CapacitorPlugin(
    name = "HomeMindSms",
    permissions = [
        Permission(
            alias = "sms",
            strings = [
                Manifest.permission.READ_SMS,
                Manifest.permission.RECEIVE_SMS
            ]
        )
    ]
)
class HomeMindSmsPlugin : Plugin() {

    override fun load() {
        super.load()
        instance = this
    }

    @PluginMethod
    fun getSmsPermissionStatus(call: PluginCall) {
        val readGranted = getPermissionState("sms") == PermissionState.GRANTED
        val ret = JSObject().apply {
            put("granted", readGranted)
            put("status", if (readGranted) "GRANTED" else "DENIED")
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun requestSmsPermissions(call: PluginCall) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            val ret = JSObject().apply {
                put("granted", true)
                put("status", "GRANTED")
            }
            call.resolve(ret)
        } else {
            requestPermissionForAlias("sms", call, "smsPermsCallback")
        }
    }

    @PermissionCallback
    private fun smsPermsCallback(call: PluginCall) {
        val granted = getPermissionState("sms") == PermissionState.GRANTED
        val ret = JSObject().apply {
            put("granted", granted)
            put("status", if (granted) "GRANTED" else "DENIED")
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun scanFinancialSms(call: PluginCall) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            call.reject("SMS permission not granted")
            return
        }

        val sinceTimestamp = call.getLong("sinceTimestamp") ?: 0L
        val limit = call.getInt("limit") ?: 100

        try {
            val transactions = SmsReader.scanFinancialInbox(context, sinceTimestamp, limit)
            val jsonArray = JSArray()
            for (tx in transactions) {
                jsonArray.put(tx.toJSObject())
            }

            val ret = JSObject().apply {
                put("transactions", jsonArray)
                put("count", transactions.size)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to scan SMS: ${e.message}", e)
        }
    }

    @PluginMethod
    fun parseRawSms(call: PluginCall) {
        val body = call.getString("body")
        if (body.isNullOrBlank()) {
            call.reject("SMS body is required")
            return
        }

        val sender = call.getString("sender") ?: "BANK-SMS"
        val timestamp = call.getLong("timestamp") ?: System.currentTimeMillis()

        val parsed = BankSmsParser.parse(sender, body, timestamp)
        val ret = JSObject()
        if (parsed != null) {
            ret.put("success", true)
            ret.put("transaction", parsed.toJSObject())
        } else {
            ret.put("success", false)
            ret.put("error", "Message not recognized as a financial transaction")
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun startTransactionMonitoring(call: PluginCall) {
        val prefs = context.getSharedPreferences("homemind_sms_queue", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("monitoring_enabled", true).apply()
        call.resolve(JSObject().put("success", true).put("monitoring", true))
    }

    @PluginMethod
    fun stopTransactionMonitoring(call: PluginCall) {
        val prefs = context.getSharedPreferences("homemind_sms_queue", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("monitoring_enabled", false).apply()
        call.resolve(JSObject().put("success", true).put("monitoring", false))
    }

    @PluginMethod
    fun getPendingTransactions(call: PluginCall) {
        try {
            val prefs = context.getSharedPreferences("homemind_sms_queue", Context.MODE_PRIVATE)
            val jsonStr = prefs.getString("pending_txns", "[]") ?: "[]"
            val array = JSONArray(jsonStr)
            val jsArray = JSArray()
            for (i in 0 until array.length()) {
                val item = array.getJSONObject(i)
                val jsObj = JSObject()
                val keys = item.keys()
                while (keys.hasNext()) {
                    val key = keys.next()
                    jsObj.put(key, item.get(key))
                }
                jsArray.put(jsObj)
            }

            val ret = JSObject().apply {
                put("pending", jsArray)
                put("count", array.length())
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to retrieve pending transactions: ${e.message}", e)
        }
    }

    @PluginMethod
    fun clearPendingTransactions(call: PluginCall) {
        try {
            val prefs = context.getSharedPreferences("homemind_sms_queue", Context.MODE_PRIVATE)
            prefs.edit().putString("pending_txns", "[]").apply()
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Failed to clear queue: ${e.message}", e)
        }
    }

    companion object {
        var instance: HomeMindSmsPlugin? = null

        fun notifyNewTransaction(tx: ParsedSmsTransaction) {
            instance?.let { plugin ->
                val data = JSObject().apply {
                    put("transaction", tx.toJSObject())
                }
                plugin.notifyListeners("onNewSmsTransaction", data)
            }
        }
    }
}
