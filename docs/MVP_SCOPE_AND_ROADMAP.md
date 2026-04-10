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

### Completed now

- Expo Router app shell with Spotify-style navigation and dark visual direction
- home, search, library, events, album, artist, sign-in, mini-player, and full player screens
- auth bootstrap with secure token storage
- sign-up flow with redirect back to sign-in after registration
- authenticated library loading
- liked songs toggles and liked songs surfacing in Library
- playlist list, create, detail, edit, delete, reorder, remove-track, and add-to-playlist flow
- artist detail follow toggle and followed artists surfacing in Library
- backend queue sync plus add-to-queue
- next, previous, play/pause, progress sync, seek sync, and qualified play recording
- `expo-audio` playback engine integration
- background playback mode and lock-screen metadata activation groundwork
- download URL handling, device file download, and local download registry
- offline-preferred playback for downloaded songs
- queued offline like and follow actions with reconnect sync flush
- queued offline play-history with reconnect sync flush
- resumable pause/resume/retry download flow with persisted state

### Active next targets

- richer queue management UX inside the player
- robust mobile HTTPS backend exposure for phone testing
- email verification handling beyond sign-up handoff
- background playback and lock-screen controls
- true background download execution

### Remaining MVP gaps

- event detail, waitlist, and ticket handoff

## Key product decisions

- Offline streaming is treated as playback of previously downloaded files, not true live networkless streaming.
- Music reliability matters more than decorative UI complexity.
- Events should feel integrated with the music ecosystem, but they must not dominate the core navigation.
- We should reuse backend capabilities first and only request new APIs when mobile has a hard blocker.
