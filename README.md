# TesoTunes Mobile Expo

This directory is the dedicated Expo React Native workspace for the TesoTunes consumer mobile app.

The strict MVP is:

- music streaming
- downloads including offline playback
- an events module

The current web and API codebases already expose most of the product surface we need. This app should stay focused on a clean, mobile-native experience instead of trying to replicate every web feature.

## Product direction

- Visual direction: Spotify-inspired browsing, strong artwork, immersive dark UI, mini-player, full-screen player, bottom tabs.
- Scope guardrail: no social feed, no creator studio, no admin panel, no marketplace, no awards in MVP.
- Technical priority: reliable audio playback and offline behavior before decorative features.

## Existing platform alignment

- Backend: `C:\Users\egony\Project\tesotunes-api`
- Web reference: `C:\Users\egony\Project\tesotunes-next-web`

Important backend surfaces already present:

- `GET /api/mobile/trending/songs`
- `GET /api/mobile/popular/artists`
- `GET /api/mobile/popular/albums`
- `POST /api/player/update-now-playing`
- `POST /api/player/record-play`
- `GET /api/player/queue`
- `GET /api/user/library`
- `GET /api/events`
- `GET /api/events/featured`
- `GET /api/events/upcoming`
- `GET /api/mobile/downloads/song/{song}`
- `POST /api/mobile/sync/full`

Current mobile implementation status:

- Spotify-style tab shell and player
- public home and events data loading with API fallback behavior
- sign-in, sign-up, and authenticated library
- backend queue sync and add-to-queue
- real audio playback with `expo-audio`
- full player progress, seek, next, previous, and queue-aware transport fallback
- song likes and playlist management foundations
- artist follow actions and followed artists library surfacing
- local download registry plus download actions
- offline-preferred playback for downloaded songs
- queued like and follow actions with reconnect sync foundation
- queued play-history sync for offline listening sessions
- resumable pause/resume/retry download foundation
- background playback and lock-screen metadata groundwork with `expo-audio`
- events listing wired to backend

## Delivery Status

### Completed

- app shell, tabs, mini-player, full player
- home discovery, search shell, library shell, events shell
- auth bootstrap, sign-in flow, and sign-up flow
- authenticated library fetch
- backend queue sync and queue actions
- real audio engine integration
- playback progress tracking and seek controls
- qualified play recording and now-playing sync
- song like toggles and liked songs library section
- playlist list, create, detail, edit, delete, reorder, remove-track, and add-track flow
- artist follow toggle and followed artists section
- local downloads registry and downloaded library section
- offline playback preference for downloaded tracks
- queued offline like/follow actions with periodic sync flush
- queued offline play-history with periodic sync flush
- resumable pause/resume/retry download flow
- background playback mode plus lock-screen metadata activation

### In progress

- hardened mobile backend exposure via stable HTTPS host
- richer player session UX such as draggable progress and fuller queue management
- email verification handling beyond sign-up handoff
- background-capable downloads beyond in-app pause/resume/retry
- native verification of lock-screen/background playback in a dev build

### Not done yet

- event detail and waitlist flows
- ticket handoff flows
- background playback and lock-screen controls

## Planning docs

- `docs/MVP_SCOPE_AND_ROADMAP.md`
- `docs/API_ALIGNMENT.md`

## Environment

Create a local `.env` from `.env.example` and point it to the Laravel API.

Recommended for real phone testing:

- use an HTTPS URL that your phone can reach
- avoid relying on `php artisan serve` over raw LAN as the long-term setup
- make sure the API and media URLs come from the same reachable host

## Commands

```bash
npm install
npm run start
npm run check
```

## Preview On Your Phone

1. Install `Expo Go` on your Android or iPhone.
2. In this project folder run `npm run start`.
3. Scan the QR code from the terminal with Expo Go.

For backend access from your phone, do not use `127.0.0.1` in `.env`.

Temporary LAN example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000/api
```

Also start Laravel so it is reachable on your network:

```bash
php artisan serve --host=0.0.0.0 --port=8000 --no-reload
```

Your phone and computer must be on the same Wi‑Fi network.

## Standard Mobile Backend Setup

For stable on-device work, use a real HTTPS endpoint instead of depending on a local LAN IP.

Recommended options:

1. Put the API behind a tunnel such as Cloudflare Tunnel or ngrok.
2. Use that HTTPS host in `EXPO_PUBLIC_API_BASE_URL`.
3. Update the Laravel backend URL config so generated artwork/audio/download URLs also use that same reachable host.

Why this matters:

- the failing mobile login requests were not reaching Laravel at all
- local `.test` URLs like `http://tesotunes-api.test/...` are not usable on a phone
- authenticated POST flows are more sensitive to unstable local-device networking than basic GET checks

Minimum backend alignment for phone testing:

- `APP_URL` should be a host your phone can open
- signed download/media URLs should resolve from the phone, not just the laptop
- Windows Firewall or network isolation must allow inbound traffic if you still use LAN mode

## Native Playback Note

Background playback and lock-screen controls now have app-side wiring, but they need a real native build to verify fully.

- Expo Go is not the final authority for background media behavior
- use an Android or iOS dev build after adding the `expo-audio` config plugin
- rebuild the app after changes to `app.json` so the foreground service and background audio settings are applied
