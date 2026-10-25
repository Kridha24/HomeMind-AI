package com.kridha.homemind.sms

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class UpiNotificationListener : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        try {
            val packageName = sbn.packageName ?: return
            // Check if from supported UPI app
            if (!UpiNotificationParser.isSupportedPackage(packageName)) {
                return
            }

            val extras = sbn.notification?.extras ?: return
            val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()
            val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()
            val postTime = if (sbn.postTime > 0) sbn.postTime else System.currentTimeMillis()

            val parsed = UpiNotificationParser.parse(packageName, title, text, subText, postTime) ?: return

            // 1. Store in offline persistent queue so it is resilient if app is in background or offline
            TransactionStore.storeInPendingQueue(applicationContext, parsed)

            // 2. Notify active Capacitor plugin listener if app is running in foreground
            HomeMindSmsPlugin.notifyNewTransaction(parsed)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
