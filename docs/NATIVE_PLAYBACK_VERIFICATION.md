# Native Playback Verification

This checklist is for validating the Android dev build after the current `expo-audio` integration, queue UX, and background playback groundwork.

Use this after installing a fresh dev build, not just Expo Go.

## Preconditions

- App build is a native dev build created after the latest `app.json` and playback-provider changes
- Device has network access to the configured API and media URLs
- At least one song has a valid `audio_url` or `stream_url`
- `EXPO_PUBLIC_API_BASE_URL` points to a reachable host such as `https://api.tesotunes.com/api`
- You are signed in if you want queue sync, likes, downloads, and library validation

## What should work in the current implementation

- foreground playback
- playback continuing after app backgrounding
- Android media notification / lock-screen metadata with live title, artist, and album when available
- play and pause from the player UI
- seek from the player UI
- skip forward and skip backward by 10 seconds from lock-screen controls when exposed by the OS
- queue sync with the backend from in-app controls

## What is not yet guaranteed by the current implementation

- next/previous lock-screen transport buttons
- true background downloads
- a full native playback service verification across all Android OEM battery modes

The current app uses a single `expo-audio` player with lock-screen metadata and seek controls enabled. If native next/previous controls are required later, we may need a different playback model.

Current Expo SDK 55 note:

- `expo-audio` currently exposes lock-screen / notification metadata plus seek backward and seek forward options
- it does not expose native next/previous notification transport buttons in the current API surface
- if richer system transport controls become a hard requirement, the migration candidate is `react-native-track-player`

## Test Flow

### 1. Foreground playback baseline

1. Open the app.
2. Start a real track from Home, Search, Album, Artist, or Library.
3. Confirm artwork, title, artist, progress, and elapsed time update in the full player.
4. Confirm play, pause, next, previous, seek forward, and seek backward work in-app.

Pass:

- audio starts quickly
- progress moves
- no red playback error is shown

Fail symptoms:

- “This track does not have a playable audio source yet.”
- progress frozen at `0:00`
- next/previous updates UI but no audio changes

### 2. Background playback

1. Start playback.
2. Press the home button and leave the app in the background.
3. Wait at least 30 seconds.
4. Confirm audio continues.
5. Re-open the app and confirm the player state is still coherent.

Pass:

- audio keeps playing in background
- returning to app does not reset playback unexpectedly

Fail symptoms:

- audio stops immediately when app backgrounds
- app resumes with lost player state

### 3. Lock-screen / notification controls

1. While a song is playing, lock the phone.
2. Wake the device and inspect the lock screen and notification shade.
3. Confirm title and artist are visible.
4. Confirm the artist is the real backend artist name, not `Unknown artist`.
5. Test pause and play from the lock screen or notification.
6. Test seek forward/backward if those controls are shown.

Pass:

- media notification or lock-screen card appears
- metadata matches the active song
- play/pause works from the system UI
- seek forward/backward works if presented

Important note:

- absence of next/previous buttons is not an automatic failure for this iteration

### 4. Long background hold

1. Start playback and background the app.
2. Leave it for more than 3 minutes.
3. Confirm playback continues.

Pass:

- playback survives the 3-minute background threshold

Fail symptoms:

- playback stops around 3 minutes, which usually points to lock-screen / foreground-service behavior not being sustained on-device

### 5. Queue behavior

1. Add several songs to queue.
2. Open the full player.
3. Shuffle the queue.
4. Move one queued item up and another down.
5. Remove one queued item.
6. Clear the queue.

Pass:

- queue changes are reflected in the player UI
- current song remains stable while editing up-next items
- queue state refreshes correctly after each action

Fail symptoms:

- queue list reorders visually but snaps back
- remove or clear actions fail silently
- current track disappears unexpectedly

### 6. Offline-preferred playback

1. Download a song.
2. Start that song once while online.
3. Disable network access.
4. Play the downloaded song again.

Pass:

- track plays from the downloaded file
- player shows the offline badge where expected

Fail symptoms:

- downloaded song tries to fetch remote audio only
- playback fails offline despite completed download state

## Suggested Result Template

Record results like this:

```text
Build:
Device:
Android version:

Foreground playback: pass/fail
Background playback: pass/fail
Lock-screen metadata: pass/fail
Lock-screen play/pause: pass/fail
Lock-screen seek: pass/fail/not shown
3-minute background hold: pass/fail
Queue actions: pass/fail
Offline-preferred playback: pass/fail

Notes:
```

## If A Test Fails

- Capture the exact screen and action that failed
- Note whether the failure happened in foreground, background, or lock screen
- Note whether the device vendor battery saver was on
- Re-test once after force-closing and reopening the app
- If the 3-minute background hold fails consistently, treat it as a native playback blocker for this phase
