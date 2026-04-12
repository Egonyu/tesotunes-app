# TesoTunes Mobile MVP Scope And Roadmap

## North star

Build a consumer-facing mobile app that does three things very well:

1. stream music
2. download music for offline playback
3. help users discover and follow events

Everything else is secondary until those three loops feel fast, stable, and trustworthy.

## Visual reference

The provided Figma prototype is being used as direction, not as a literal feature contract. The intended feel is:

- dark, immersive, music-first browsing
- large artwork and expressive player screens
- bottom-tab navigation
- mini-player that persists across the app
- clean motion and tight focus on listening

## Strict MVP modules

### 1. Authentication and session

- sign in
- sign up with email verification handoff
- session restore
- token refresh or re-auth strategy aligned with existing backend auth

### 2. Music home and discovery

- home feed from trending songs, popular artists, popular albums, featured charts
- lightweight search entrypoint
- song, artist, album, and playlist detail pages

### 3. Playback

- play and pause
- seek
- next and previous
- queue management
- mini-player
- full-screen player
- playback state persistence
- server play tracking when online

### 4. Library

- liked songs
- saved albums
- followed artists
- owned playlists
- recently played
- downloads

### 5. Offline downloads

- request secure download URL from mobile routes
- background or resumable file download strategy
- local media index stored on device
- offline playback from downloaded files
- sync pending play history and user actions after reconnect

### 6. Events

- featured events
- upcoming events
- event categories
- event detail
- express interest
- join waitlist where supported
- ticket visibility and ticket detail handoff

## Explicit non-MVP

- creator tools
- artist upload studio
- admin dashboards
- social feed and posting
- podcasts
- radio
- ecommerce and store flows
- awards and campaigns
- advanced personalization
- subscriptions and payments beyond what is required for content access

## Recommended app structure

```text
tesotunes-mobile-expo/
  docs/
  src/
    app/
    components/
    features/
      auth/
      music/
      player/
      library/
      downloads/
      events/
    services/
      api/
      auth/
      audio/
      storage/
      sync/
    store/
    theme/
    types/
```

## Technical stack recommendation

- Expo managed workflow
- TypeScript
- Expo Router for navigation
- TanStack Query for server state
- Zustand for local player and download state
- Expo Secure Store for credentials
- Expo File System for downloads and offline cache
- Expo SQLite for local indexes and sync queue
- Expo AV or the current Expo audio stack after confirming SDK 54 best practice
- React Native Track Player only if Expo audio proves insufficient for background behavior and lock-screen controls

## Delivery phases

### Phase 0: Foundation

- [x] initialize navigation and folder structure
- [x] define API client and auth boundary
- [x] set theme tokens and base layout
- [x] wire secure storage and app bootstrap

### Phase 1: Listening path

- [x] home screen
- [x] content detail screens
- [x] player shell
- [x] queue and play tracking
- [x] library overview
- [x] real audio playback engine
- [x] seek controls and progress sync
- [x] liked songs interactions
- [x] playlist list and creation
- [x] add-track-to-playlist flow
- [x] artist follow actions
- [x] playlist edit and delete flows
- [x] playlist track reorder and remove flow
- [~] queue UX polish

Success condition:

- a signed-in user can browse, open a song, play it, control the queue, and revisit recent listening state

### Phase 2: Offline path

- [x] download manager foundation
- [x] local media registry
- [x] downloaded songs screen
- [x] offline playback selection rules
- [x] reconnect sync foundation for likes and follows
- [x] play-history sync foundation for offline listening sessions
- [~] resumable pause/resume/retry downloads
- [ ] true background downloads

Success condition:

- a user can download a song while online and play it later without network

### Phase 3: Events path

- [x] events listing
- [ ] event details
- [ ] categories
- [ ] interest and waitlist flows
- [ ] tickets visibility

Success condition:

- a user can discover an event, view details, and save intent around attendance

## Current Status Board

### Real

- Auth and session: secure token bootstrap, sign-in, sign-up handoff, session restore
- Playback core: real `expo-audio` playback, seek/progress sync, queue sync, qualified play recording
- Playlists: list, create, detail, edit, delete, reorder, remove-track, add-to-playlist
- Downloads and offline: secure download URLs, local registry, offline-preferred playback, queued sync for likes, follows, and play history
- Library foundations: authenticated liked songs, followed artists, recent plays, downloads, playlists, and library collection rails driven by live user data
- Discovery data foundations: live home songs, artists, albums, dedicated artists browse, dedicated albums browse, featured chart detail, dedicated charts browse, genre browse, dedicated genres browse, song search, genre detail, album detail

### Hybrid

- Home and discovery: featured charts and chart detail are wired, but production currently returns an empty charts dataset so the UI now falls back to explicit, actionable empty states and alternate discovery entry points; artist and album browse now also fall back to stable public catalog endpoints when mobile convenience endpoints fail
- Search: live songs, genres, albums, artists, and playlists are wired, browse surfaces now include dedicated charts and genres routes, and grouped search states now render explicit section counts and empty states instead of silently collapsing, but non-song search groups may still be empty until more public catalog data is available
- Artist detail: live artist stats, songs, and albums are wired; remaining richness still depends on catalog completeness from the public API
- Library experience: real data is primary, and core music collections now deep-link into focused library subsections; some overview labels still remain static presentation copy
- Build and release: dev build path exists and GitHub Actions now cover install, TypeScript, Expo doctor, and config validation; stronger native verification is still pending
- Player queue UX: full player now supports live shuffle, clear, remove, manual up/down queue ordering, and play-now promotion from the upcoming queue, but we still need native on-device verification of the overall playback experience
- Background playback groundwork: the Expo audio provider now keeps the audio session active during background transitions instead of deactivating it, live track metadata now maps the backend's top-level artist field correctly for player and notification display, and the remaining work is device verification of lock-screen and foreground-service behavior
- Email verification handling: mobile auth now recognizes unverified-email login responses, routes new signups into a verification screen, supports resend from the app, can complete verification when opened on the signed `tesotunes://verify-email` callback, and the web verification page now attempts native app handoff before falling back to browser verification

### Template/Mock

- Events module beyond listing
- Queue UX polish inside the full player beyond the current play-now and ordering controls
- Background download execution
- Lock-screen controls and full native background playback verification

### Active next targets

- native verification of the upgraded queue management UX inside the player
- robust mobile HTTPS backend exposure for phone testing
- lock-screen controls and native background playback verification
- true background download execution
- optional EAS-trigger automation once the base mobile CI signal is stable
- richer playback polish on a real Android dev build

Native verification reference:

- `docs/NATIVE_PLAYBACK_VERIFICATION.md`
- `docs/ANDROID_DEV_BUILD_GUIDE.md`

### Remaining MVP gaps

- event detail, waitlist, and ticket handoff

## Key product decisions

- Offline streaming is treated as playback of previously downloaded files, not true live networkless streaming.
- Music reliability matters more than decorative UI complexity.
- Events should feel integrated with the music ecosystem, but they must not dominate the core navigation.
- We should reuse backend capabilities first and only request new APIs when mobile has a hard blocker.
