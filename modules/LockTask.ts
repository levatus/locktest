/**
 * Thin wrapper around the LockTaskModule native Android module.
 *
 * startLock() calls Activity.startLockTask() — pins the app so Back and Home
 * are disabled. Requires the app to be set as Device Owner via ADB:
 *   adb shell dpm set-device-owner com.locktest.app/.MainApplication
 * If the device is not a Device Owner the OS silently ignores the call.
 *
 * stopLock() calls Activity.stopLockTask() AND restores the navigation bar via
 * the Kotlin layer (WindowInsetsController on API 30+, systemUiVisibility on older).
 *
 * Both functions are no-ops on iOS and on web.
 */

import { NativeModules, Platform } from "react-native";

interface LockTaskNativeModule {
  startLock: () => Promise<void>;
  stopLock: () => Promise<void>;
}

const { LockTaskModule } = NativeModules as {
  LockTaskModule: LockTaskNativeModule | undefined;
};

export async function startLock(): Promise<void> {
  if (Platform.OS !== "android" || !LockTaskModule) return;
  try {
    await LockTaskModule.startLock();
  } catch {
    // Device Owner not set — silently ignored
  }
}

export async function stopLock(): Promise<void> {
  if (Platform.OS !== "android" || !LockTaskModule) return;
  try {
    await LockTaskModule.stopLock();
  } catch {
    // Not in lock task mode — silently ignored
  }
}
