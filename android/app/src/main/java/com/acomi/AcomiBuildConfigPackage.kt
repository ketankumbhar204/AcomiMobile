package com.acomi

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class AcomiBuildConfigPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    if (name == "AcomiBuildConfig") {
      return AcomiBuildConfigModule(reactContext)
    }
    return null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        "AcomiBuildConfig" to ReactModuleInfo(
          "AcomiBuildConfig",
          AcomiBuildConfigModule::class.java.name,
          false,
          false,
          false,
          false,
        ),
      )
    }
  }
}
