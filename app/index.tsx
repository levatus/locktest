import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from "expo-keep-awake";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LockScreen() {
  const [isAwake, setIsAwake] = useState(false);
  const insets = useSafeAreaInsets();

  const toggle = async () => {
    if (isAwake) {
      deactivateKeepAwake();
      setIsAwake(false);
    } else {
      await activateKeepAwakeAsync();
      setIsAwake(true);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, isAwake ? styles.buttonLock : styles.buttonUnlock]}
        onPress={toggle}
        activeOpacity={0.8}
        testID="lock-toggle-button"
      >
        <Text style={styles.buttonText}>
          {isAwake ? "Lock" : "Unlock"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
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
  buttonUnlock: {
    backgroundColor: "#0d1a0d",
    borderColor: "#4ade80",
    shadowColor: "#4ade80",
  },
  buttonLock: {
    backgroundColor: "#1a0d0d",
    borderColor: "#f87171",
    shadowColor: "#f87171",
  },
  buttonText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 1,
  },
});
