package com.acomi

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class AcomiNotificationPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    if (name == "AcomiNotifications") {
      return AcomiNotificationModule(reactContext)
    }
    return null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        "AcomiNotifications" to ReactModuleInfo(
          "AcomiNotifications",
          AcomiNotificationModule::class.java.name,
          false,
          false,
          false,
          false,
        ),
      )
    }
  }
}
