package com.acomi



import android.content.Intent

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

  override fun getMainComponentName(): String = "Acomi"



  override fun onCreate(savedInstanceState: Bundle?) {

    // Emulator OpenGL often fails to init 101010-2 and leaves a black Fabric surface.

    window.setFormat(PixelFormat.RGBA_8888)

    super.onCreate(savedInstanceState)

    // Drop the splash bitmap once the first frame is up so it cannot sit
    // behind the tab bar after the React tree is showing.
    window.decorView.post {
      window.setBackgroundDrawableResource(R.color.app_background)
    }
    deliverNotificationIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    deliverNotificationIntent(intent)
  }

  private fun deliverNotificationIntent(source: Intent?) {
    if (source == null) {
      return
    }
    val json = source.getStringExtra(AcomiNotificationBridge.EXTRA) ?: return
    source.removeExtra(AcomiNotificationBridge.EXTRA)
    AcomiNotificationBridge.deliver(json)
  }



  /**

   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]

   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]

   */

  override fun createReactActivityDelegate(): ReactActivityDelegate =

      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

}

