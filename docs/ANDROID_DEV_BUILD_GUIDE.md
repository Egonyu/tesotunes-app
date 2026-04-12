# Android Dev Build Guide

Use this flow when testing playback, notification controls, downloads, or any behavior that depends on native Expo plugins.

Do not rely on Expo Go for this project.

## Current baseline

- Expo SDK: `55`
- EAS project id: `8c17c3dc-1efa-4979-aa1b-cebcddea0b84`
- Android package: `com.tesotunes.mobile`
- API base URL: `https://api.tesotunes.com/api`
- Background playback plugin: enabled through `expo-audio`

## Before building

Run these checks from the project root:

```powershell
npm run check
npm run doctor
npm run config:check
```

Expected result:

- TypeScript passes
- Expo doctor passes
- public Expo config resolves without errors

## Build a fresh Android dev client

From the project root:

```powershell
npm run build:android:dev
```

That resolves to:

```powershell
npx eas-cli build --platform android --profile development
```

Use this when:

- native plugin config changed
- notification or background playback behavior needs verification
- a Metro reload is not reflecting expected native behavior

## Install and connect the build

1. Install the generated APK on the Android device.
2. Start Metro for the dev client:

```powershell
npm run start:dev-client
```

3. Open the installed TesoTunes dev app on the phone.
4. Connect it to the running Metro server.

## Verification checklist

Use:

- `docs/NATIVE_PLAYBACK_VERIFICATION.md`

Priority checks for the current phase:

1. Sign in against the production API.
2. Play a real song with a valid `audio_url`.
3. Confirm the player shows the real artist name.
4. Background the app and confirm playback continues.
5. Open the notification shade and confirm metadata appears.
6. Test play and pause from the notification.
7. Test seek backward and seek forward if Android exposes them.
8. Confirm playback continues beyond 3 minutes in background.

## Important current limitation

With the current Expo SDK 55 `expo-audio` integration:

- notification and lock-screen metadata should work
- play and pause should work through the system media surface when the OS exposes them
- seek backward and seek forward may appear
- native next and previous notification buttons are not part of the current `expo-audio` lock-screen API

If native next/previous transport controls become mandatory, treat that as a playback-stack decision and evaluate `react-native-track-player`.

## When you need a rebuild

Rebuild the Android dev client if any of these change:

- `app.json`
- Expo config plugins
- package versions for native Expo modules
- native playback behavior tied to foreground service or lock-screen integration

If only React/TypeScript screen logic changed, a normal dev-client reload is usually enough.
