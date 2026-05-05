# Locktest

A minimal Expo app for testing device lock/unlock functionality.

## What it does

Displays a single large button that toggles the device screen lock:

- **Unlock Screen** — activates keep-awake, preventing the screen from auto-locking
- **Lock Screen** — deactivates keep-awake, allowing the screen to auto-lock normally

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your device.

## Stack

- Expo SDK 54
- expo-keep-awake (screen lock/unlock control)
- expo-router (file-based routing)
- React Native 0.81
