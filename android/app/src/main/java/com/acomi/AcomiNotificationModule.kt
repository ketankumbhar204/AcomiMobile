package com.acomi

import android.Manifest
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AcomiNotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AcomiNotifications"

  override fun initialize() {
    super.initialize()
    AcomiNotificationBridge.attach(reactContext)
  }

  override fun invalidate() {
    AcomiNotificationBridge.detach(reactContext)
    super.invalidate()
  }

  @ReactMethod
  fun display(title: String?, body: String?, messageKey: String?, payloadJson: String?, promise: Promise) {
    val safeTitle = title?.trim().orEmpty()
    val safeBody = body?.trim().orEmpty()
    if (safeTitle.isEmpty() && safeBody.isEmpty()) {
      promise.resolve("EMPTY")
      return
    }
    if (!notificationsEnabled()) {
      promise.resolve("PERMISSION_BLOCKED")
      return
    }
    try {
      val launch = Intent(reactContext, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        putExtra(AcomiNotificationBridge.EXTRA, payloadJson ?: "{}")
      }
      val requestCode = (messageKey ?: safeTitle).hashCode()
      val contentIntent = PendingIntent.getActivity(
        reactContext,
        requestCode,
        launch,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
      val notification = NotificationCompat.Builder(reactContext, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_stat_acomi)
        .setContentTitle(safeTitle.ifEmpty { "ACOMI" })
        .setContentText(safeBody)
        .setStyle(NotificationCompat.BigTextStyle().bigText(safeBody))
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setAutoCancel(true)
        .setContentIntent(contentIntent)
        .build()
      NotificationManagerCompat.from(reactContext).notify(requestCode, notification)
      promise.resolve("DISPLAYED")
    } catch (security: SecurityException) {
      promise.resolve("PERMISSION_BLOCKED")
    }
  }

  @ReactMethod
  fun consumeOpened(promise: Promise) {
    promise.resolve(AcomiNotificationBridge.consumePending())
  }

  @ReactMethod
  fun addListener(eventName: String) = Unit

  @ReactMethod
  fun removeListeners(count: Int) = Unit

  private fun notificationsEnabled(): Boolean {
    if (!NotificationManagerCompat.from(reactContext).areNotificationsEnabled()) {
      return false
    }
    if (Build.VERSION.SDK_INT < 33) {
      return true
    }
    return ContextCompat.checkSelfPermission(reactContext, Manifest.permission.POST_NOTIFICATIONS) ==
      PackageManager.PERMISSION_GRANTED
  }

  companion object {
    const val CHANNEL_ID = "acomi_transactions"
  }
}
