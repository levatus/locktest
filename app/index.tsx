import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from "expo-keep-awake";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
      <Text style={styles.status}>
        Screen is{" "}
        <Text style={[styles.statusValue, isAwake ? styles.awake : styles.locked]}>
          {isAwake ? "Unlocked" : "Locked"}
        </Text>
      </Text>

      <TouchableOpacity
        style={[styles.button, isAwake ? styles.buttonLock : styles.buttonUnlock]}
        onPress={toggle}
        activeOpacity={0.8}
        testID="lock-toggle-button"
      >
        <Text style={styles.buttonText}>
          {isAwake ? "Lock Screen" : "Unlock Screen"}
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
    gap: 40,
  },
  status: {
    fontSize: 18,
    color: "#888",
    letterSpacing: 0.3,
  },
  statusValue: {
    fontWeight: "700",
  },
  awake: {
    color: "#4ade80",
  },
  locked: {
    color: "#f87171",
  },
  button: {
    width: 260,
    height: 260,
    borderRadius: 130,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  buttonUnlock: {
    backgroundColor: "#1a1a2e",
    borderWidth: 3,
    borderColor: "#4ade80",
    shadowColor: "#4ade80",
  },
  buttonLock: {
    backgroundColor: "#1a0d0d",
    borderWidth: 3,
    borderColor: "#f87171",
    shadowColor: "#f87171",
  },
  buttonText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
});
