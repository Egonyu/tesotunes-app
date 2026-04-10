# API Alignment For Mobile MVP

## What already exists and is useful now

### Music and discovery

- Public song, artist, album, genre, and playlist endpoints already exist in the Laravel API.
- Mobile-specific discovery endpoints already exist under `/api/mobile`.
- Authenticated library endpoints already exist under `/api/user/library`, `/api/library/*`, and playlist ownership routes already used by the web app.

### Playback

- Authenticated player endpoints already exist for:
  - now playing
  - play recording
  - status
  - previous
  - next
  - seek
  - queue CRUD

### Downloads and sync

- Mobile-specific download endpoints already exist under `/api/mobile/downloads/*`.
- Mobile-specific sync endpoints already exist under `/api/mobile/sync/*`.

### Events

- Public event browsing already exists for:
  - `/api/events`
  - `/api/events/featured`
  - `/api/events/upcoming`
  - `/api/events/categories`
  - `/api/events/{id}`
- Authenticated event actions already exist for interest and waitlist.

## What mobile can reuse from the web reference

- API access patterns from `tesotunes-next-web/src/lib/api`
- catalog and library query shapes from `tesotunes-next-web/src/hooks/api.ts`
- event query shapes from `tesotunes-next-web/src/hooks/useEvents.ts`
- player data assumptions from `tesotunes-next-web/src/components/player` and `tesotunes-next-web/src/stores/player.ts`

## Mobile-specific gaps to validate early

### 1. Auth strategy for Expo

The web app appears session-aware and browser-oriented in places. We need a dedicated mobile auth contract that is easy to store and refresh in Expo. This is the first backend handshake to verify.

### 2. Offline license and URL lifetime

If download URLs are short-lived or signed, we need to confirm:

- how long a fetched download URL remains valid
- whether mobile should store raw files or encrypted blobs
- whether the API returns enough metadata for resumable downloads

### 3. Playback source priority

The web player chooses between `audio_url`, `stream_url`, `file_url`, and `preview_url`. The mobile player needs one canonical resolver with this order:

1. local offline file
2. authenticated stream URL
3. fallback file URL if permitted
4. preview only when full access is unavailable

### 4. Sync conflict model

Offline plays, likes, and download history may be queued locally. We need backend expectations for replaying those actions once the device reconnects.

### 5. Event ticket handoff

The backend exposes rich ticket operations. For MVP we should confirm which of these are truly consumer-facing on mobile versus artist or ops tooling.

## Immediate implementation recommendation

Start with these slices first:

1. auth bootstrap
2. discovery home from `/api/mobile/*`
3. song detail and player
4. user library
5. download manager using `/api/mobile/downloads/song/{song}`
6. event listing and detail

Everything else should wait until those paths are stable.
