package com.appzyro.shiftmaster.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Device rebooted, rescheduling shift reminders")
            // In a real app, we would fetch saved shifts from a database and reschedule them.
            // For this implementation, we'll call a helper to handle the rescheduling logic.
            NotificationHelper.rescheduleAllAlarms(context)
        }
    }
}
