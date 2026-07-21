package com.countin

import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "CountIn"

  override fun onCreate(savedInstanceState: Bundle?) {
    // Emulator OpenGL often fails to init 101010-2 and leaves a black Fabric surface.
    window.setFormat(PixelFormat.RGBA_8888)
    window.decorView.setBackgroundColor(Color.parseColor("#ECFDF5"))
    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
