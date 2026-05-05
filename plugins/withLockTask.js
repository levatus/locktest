/**
 * Config plugin that implements Android Lock Task Mode for the Locktest app.
 *
 * During `expo prebuild` this plugin:
 *  1. Writes LockTaskModule.kt and LockTaskPackage.kt into the Android source tree.
 *  2. Does NOT patch onResume — Locktest only locks/unlocks on explicit button press.
 *  3. Patches MainApplication.kt to register LockTaskPackage so JS can call
 *     NativeModules.LockTaskModule.startLock() / stopLock().
 *
 * LockTaskModule.whitelistSelf():
 *  - If locktest IS the device owner (set via `adb shell dpm set-device-owner
 *    com.locktest.app/.LocktestDeviceAdminReceiver`), it whitelists itself and
 *    startLockTask() succeeds with no other app involved.
 *  - If locktest is NOT the device owner (kiosk workflow), the call is a no-op
 *    and the kiosk app must have already whitelisted com.locktest.app.
 */

const {
  withMainApplication,
  withDangerousMod,
} = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const LOCK_TASK_MODULE_KT = (packageName) => `\
package ${packageName}

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.util.Log
import android.view.View
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LockTaskModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LockTaskModule"

    /**
     * If this app is the device owner, whitelist itself so startLockTask() succeeds
     * standalone. If not device owner, this is a no-op — the device owner (kiosk)
     * must have whitelisted com.locktest.app via its own setLockTaskPackages call.
     */
    private fun whitelistSelf() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return
        try {
            val dpm = reactApplicationContext
                .getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            if (!dpm.isDeviceOwnerApp(reactApplicationContext.packageName)) {
                Log.d("LocktestLock", "whitelistSelf: not device owner, skipping")
                return
            }
            val admin = ComponentName(
                reactApplicationContext,
                LocktestDeviceAdminReceiver::class.java
            )
            dpm.setLockTaskPackages(admin, arrayOf(reactApplicationContext.packageName))
            Log.d("LocktestLock", "whitelistSelf: setLockTaskPackages succeeded (self as device owner)")
        } catch (e: Exception) {
            Log.e("LocktestLock", "whitelistSelf: threw: \${e.message}", e)
        }
    }

    @ReactMethod
    fun startLock(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current Activity")
            return
        }
        whitelistSelf()
        Log.d("LocktestLock", "startLock: dispatching to UI thread")
        activity.runOnUiThread {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    activity.startLockTask()
                    Log.d("LocktestLock", "startLock: startLockTask() succeeded")
                }
                promise.resolve(null)
            } catch (e: Exception) {
                Log.e("LocktestLock", "startLock: startLockTask() threw: \${e.message}", e)
                promise.reject("START_LOCK_TASK_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun stopLock(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            Log.e("LocktestLock", "stopLock: currentActivity is null")
            promise.reject("NO_ACTIVITY", "No current Activity")
            return
        }
        Log.d("LocktestLock", "stopLock: dispatching to UI thread")
        activity.runOnUiThread {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    activity.stopLockTask()
                    Log.d("LocktestLock", "stopLock: stopLockTask() succeeded")
                }

                // Restore the navigation bar after stopping lock task.
                val window = activity.window
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    window.insetsController?.show(android.view.WindowInsets.Type.systemBars())
                    Log.d("LocktestLock", "stopLock: restored nav bar via WindowInsetsController")
                } else {
                    @Suppress("DEPRECATION")
                    window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
                    Log.d("LocktestLock", "stopLock: restored nav bar via systemUiVisibility")
                }

                promise.resolve(null)
            } catch (e: Exception) {
                Log.e("LocktestLock", "stopLock: threw: \${e.message}", e)
                promise.reject("STOP_LOCK_TASK_FAILED", e.message, e)
            }
        }
    }
}
`;

const LOCK_TASK_PACKAGE_KT = (packageName) => `\
package ${packageName}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class LockTaskPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(LockTaskModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
`;

function writeKotlinFiles(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName =
        config.android?.package ?? "com.locktest.app";
      const packagePath = packageName.replace(/\./g, "/");
      const javaDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java",
        packagePath
      );

      fs.mkdirSync(javaDir, { recursive: true });

      fs.writeFileSync(
        path.join(javaDir, "LockTaskModule.kt"),
        LOCK_TASK_MODULE_KT(packageName)
      );
      fs.writeFileSync(
        path.join(javaDir, "LockTaskPackage.kt"),
        LOCK_TASK_PACKAGE_KT(packageName)
      );

      return config;
    },
  ]);
}

function patchMainApplication(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    const packageName =
      config.android?.package ?? "com.locktest.app";

    if (contents.includes("LockTaskPackage")) {
      console.log("[withLockTask] LockTaskPackage already present, skipping patch");
      return config;
    }

    // Add import
    const importLine = `import ${packageName}.LockTaskPackage`;
    if (!contents.includes(importLine)) {
      // Try to insert after the ReactApplication import
      if (contents.includes("import com.facebook.react.ReactApplication")) {
        contents = contents.replace(
          /import com\.facebook\.react\.ReactApplication/,
          `import com.facebook.react.ReactApplication\n${importLine}`
        );
        console.log("[withLockTask] Added LockTaskPackage import (ReactApplication anchor)");
      } else {
        // Fallback: insert at the top after the package declaration
        contents = contents.replace(
          /^(package .+\n)/,
          `$1${importLine}\n`
        );
        console.log("[withLockTask] Added LockTaskPackage import (package anchor fallback)");
      }
    }

    // Patch 1 — Expo SDK 52+ / RN 0.76+ format:
    //   override fun getPackages(): List<ReactPackage> =
    //       PackageList(this).packages.apply { ... }
    if (contents.includes("PackageList(this).packages.apply")) {
      contents = contents.replace(
        /(PackageList\(this\)\.packages\.apply \{)/,
        `$1\n              add(LockTaskPackage())`
      );
      console.log("[withLockTask] Patched MainApplication via .apply {} (SDK 52+ format)");
    } else if (contents.includes("PackageList(this).packages")) {
      // Patch 2 — Older format:
      //   val packages = PackageList(this).packages
      //   packages.add(...)
      contents = contents.replace(
        /(val packages = PackageList\(this\)\.packages)/,
        `$1\n      packages.add(LockTaskPackage())`
      );
      console.log("[withLockTask] Patched MainApplication via val packages (older format)");
    } else {
      console.error("[withLockTask] ERROR: Could not find PackageList in MainApplication.kt — LockTaskPackage will NOT be registered");
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withLockTask(config) {
  config = writeKotlinFiles(config);
  config = patchMainApplication(config);
  return config;
};
