package com.acomi

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

/**
 * Exposes Android BuildConfig API targeting to JS.
 * Used by [src/config/env.ts] so walkDebug can hit the local walk backend
 * without Metro and without changing production release hosts.
 */
class AcomiBuildConfigModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AcomiBuildConfig"

  override fun getConstants(): Map<String, Any> {
    return mapOf(
      "apiMode" to BuildConfig.ACOMI_API_MODE,
      "localApiHost" to BuildConfig.ACOMI_LOCAL_API_HOST,
      "localApiPort" to BuildConfig.ACOMI_LOCAL_API_PORT,
      "allowCleartext" to BuildConfig.ACOMI_ALLOW_CLEARTEXT,
    )
  }
}
