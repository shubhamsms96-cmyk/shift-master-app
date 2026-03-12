package com.appzyro.shiftmaster.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.*
import com.appzyro.shiftmaster.R
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.util.concurrent.TimeUnit

class ShiftReminderWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        showNotification("Shift Reminder", "Don't forget to check your shift for today!")
        return Result.success()
    }

    private fun showNotification(title: String, message: String) {
        val notificationManager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "shift_reminder_channel"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Shift Reminders", NotificationManager.IMPORTANCE_DEFAULT)
            notificationManager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(applicationContext, channelId)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()

        notificationManager.notify(1, notification)
    }
}

object NotificationHelper {
    fun scheduleDailyReminder(context: Context) {
        val workRequest = PeriodicWorkRequestBuilder<ShiftReminderWorker>(24, TimeUnit.HOURS)
            .setInitialDelay(1, TimeUnit.HOURS) // Example delay
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "daily_shift_reminder",
            ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        )
    }

    fun scheduleShiftReminder(context: Context, shiftName: String, shiftTime: String, startTimeMillis: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
        val intent = Intent(context, ShiftReminderReceiver::class.java).apply {
            putExtra("SHIFT_NAME", shiftName)
            putExtra("SHIFT_TIME", shiftTime)
        }
        
        val pendingIntent = android.app.PendingIntent.getBroadcast(
            context,
            shiftName.hashCode() + startTimeMillis.toInt(),
            intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )

        // Reminder 1 hour before
        val reminderTime = startTimeMillis - (60 * 60 * 1000)
        
        if (reminderTime > System.currentTimeMillis()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    android.app.AlarmManager.RTC_WAKEUP,
                    reminderTime,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    android.app.AlarmManager.RTC_WAKEUP,
                    reminderTime,
                    pendingIntent
                )
            }
        }
    }

    fun rescheduleAllAlarms(context: Context) {
        Log.d("NotificationHelper", "Rescheduling all alarms from database...")
        val db = androidx.room.Room.databaseBuilder(
            context,
            com.appzyro.shiftmaster.data.AppDatabase::class.java, "shiftmaster-db"
        ).build()
        
        val shiftDao = db.shiftDao()
        
        // Use a coroutine to fetch shifts and schedule alarms
        CoroutineScope(Dispatchers.IO).launch {
            shiftDao.getAllShifts().collect { shifts ->
                shifts.forEach { shift ->
                    // Only schedule for future shifts
                    scheduleShiftReminderByDate(context, shift.date, shift.shiftType, saveToDb = false)
                }
            }
        }
    }

    fun testReminder(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
        val intent = Intent(context, ShiftReminderReceiver::class.java).apply {
            putExtra("SHIFT_NAME", "Test Shift")
            putExtra("SHIFT_TIME", "Now")
        }
        
        val pendingIntent = android.app.PendingIntent.getBroadcast(
            context,
            9999,
            intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )

        // Trigger in 10 seconds for testing
        val triggerTime = System.currentTimeMillis() + 10000
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                android.app.AlarmManager.RTC_WAKEUP,
                triggerTime,
                pendingIntent
            )
        } else {
            alarmManager.setExact(
                android.app.AlarmManager.RTC_WAKEUP,
                triggerTime,
                pendingIntent
            )
        }
    }

    fun scheduleShiftReminderByDate(context: Context, date: String, shiftType: String, saveToDb: Boolean = true) {
        val shiftTimes = mapOf(
            "A" to "06:00",
            "B" to "14:00",
            "C" to "22:00",
            "G" to "09:00"
        )
        
        val time = shiftTimes[shiftType] ?: return
        val dateTimeStr = "$date $time"
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm", java.util.Locale.getDefault())
        try {
            val dateObj = sdf.parse(dateTimeStr)
            dateObj?.let {
                scheduleShiftReminder(context, "Shift $shiftType", time, it.time)
                
                if (saveToDb) {
                    val db = androidx.room.Room.databaseBuilder(
                        context,
                        com.appzyro.shiftmaster.data.AppDatabase::class.java, "shiftmaster-db"
                    ).build()
                    val shiftDao = db.shiftDao()
                    CoroutineScope(Dispatchers.IO).launch {
                        shiftDao.insertShift(com.appzyro.shiftmaster.data.Shift(date, shiftType))
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("NotificationHelper", "Error parsing date: $dateTimeStr", e)
        }
    }
}
