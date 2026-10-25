package com.acomi

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

object AcomiNotificationBridge {
  const val EXTRA = "acomiNotificationPayload"
  private const val EVENT = "AcomiNotificationOpened"

  private var context: ReactApplicationContext? = null
  private var pending: String? = null

  fun attach(reactContext: ReactApplicationContext) {
    context = reactContext
    val waiting = pending ?: return
    pending = null
    emit(waiting)
  }

  fun detach(reactContext: ReactApplicationContext) {
    if (context === reactContext) {
      context = null
    }
  }

  fun deliver(json: String) {
    val current = context
    if (current == null || !current.hasActiveReactInstance()) {
      pending = json
      return
    }
    emit(json)
  }

  fun consumePending(): String? {
    val value = pending
    pending = null
    return value
  }

  private fun emit(json: String) {
    context
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit(EVENT, json)
  }
}
