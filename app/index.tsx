import * as NavigationBar from "expo-navigation-bar";
import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { startLock, stopLock } from "../modules/LockTask";

export default function LockScreen() {
  const [isLocked, setIsLocked] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLock = async () => {
    await startLock();
    if (Platform.OS === "android") {
      await NavigationBar.setVisibilityAsync("hidden");
    }
    setIsLocked(true);
  };

  const handleUnlock = async () => {
    await stopLock();
    if (Platform.OS === "android") {
      await NavigationBar.setVisibilityAsync("visible");
    }
    setIsLocked(false);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Text style={styles.statusLabel}>
        {isLocked ? "LOCKED" : "UNLOCKED"}
      </Text>

      {!isLocked ? (
        <TouchableOpacity
          style={[styles.button, styles.buttonLock]}
          onPress={handleLock}
          activeOpacity={0.8}
          testID="lock-button"
        >
          <Text style={styles.buttonText}>Lock</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.buttonUnlock]}
          onPress={handleUnlock}
          activeOpacity={0.8}
          testID="unlock-button"
        >
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 3,
    color: "#6b7280",
  },
  button: {
    width: 260,
    height: 260,
    borderRadius: 130,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonLock: {
    backgroundColor: "#1a0d0d",
    borderColor: "#f87171",
    shadowColor: "#f87171",
  },
  buttonUnlock: {
    backgroundColor: "#0d1a0d",
    borderColor: "#4ade80",
    shadowColor: "#4ade80",
  },
  buttonText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 1,
  },
});
