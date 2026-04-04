package com.snipxn.app

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "snipxn_app"

  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    enableHighRefreshRate()
    super.onCreate(null)
  }

  private fun enableHighRefreshRate() {
    val display = windowManager.defaultDisplay
    val supportedModes = display.supportedModes
    val highRefreshMode = supportedModes.maxByOrNull { it.refreshRate } ?: return
    val params = window.attributes
    params.preferredDisplayModeId = highRefreshMode.modeId
    window.attributes = params
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
