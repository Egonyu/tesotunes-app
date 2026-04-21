import { PropsWithChildren, useEffect, useMemo, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';

import { ensureRemotePlaybackTrack } from '../services/api/playback';
import { useAuthStore } from '../store/auth-store';
import { usePlayerStore } from '../store/player-store';

const sharedPlayer = createAudioPlayer(null, { updateInterval: 500, downloadFirst: false });

function formatPlaybackKey(id?: string, uri?: string | null) {
  return `${id ?? 'none'}:${uri ?? 'no-uri'}`;
}

function buildLockScreenMetadata(track?: { title: string; artist: string; albumTitle?: string; artworkUrl?: string | null }) {
  if (!track) {
    return undefined;
  }

  return {
    title: track.title,
    artist: track.artist,
    albumTitle: track.albumTitle ?? undefined,
    artworkUrl: track.artworkUrl ?? undefined,
  };
}

export async function seekActivePlayerTo(seconds: number) {
  await sharedPlayer.seekTo(Math.max(0, seconds));
}

export function AudioPlaybackProvider({ children }: PropsWithChildren) {
  const playerRef = useRef(sharedPlayer);
  const lastLoadedKeyRef = useRef<string | null>(null);
  const resolvingTrackRef = useRef<string | null>(null);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setPlaybackStatus = usePlayerStore((state) => state.setPlaybackStatus);
  const setPlaybackError = usePlayerStore((state) => state.setPlaybackError);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const playNext = usePlayerStore((state) => state.playNext);
  const token = useAuthStore((state) => state.token);
  const playbackKey = useMemo(
    () => formatPlaybackKey(currentTrack?.id, currentTrack?.playbackUri),
    [currentTrack?.id, currentTrack?.playbackUri]
  );

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: false,
    }).catch(() => {
      // Keep the app usable even if audio mode configuration fails in Expo Go.
    });

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void setIsAudioActiveAsync(true).catch(() => {
          // Ignore activation failures and let the player continue with native defaults.
        });
      }
    });

    const player = playerRef.current;
    const statusSubscription = player.addListener('playbackStatusUpdate', (status) => {
      setPlaybackStatus({
        currentTime: status.currentTime,
        durationSeconds: status.duration,
        isBuffering: status.isBuffering,
      });

      if (status.didJustFinish) {
        playNext();
      }
    });

    return () => {
      subscription.remove();
      statusSubscription.remove();
      player.remove();
    };
  }, [playNext, setPlaybackError, setPlaybackStatus]);

  useEffect(() => {
    const player = playerRef.current;
    const metadata = buildLockScreenMetadata(currentTrack ?? undefined);

    if (!currentTrack?.playbackUri) {
      player.clearLockScreenControls();

      if (currentTrack?.sourceId && resolvingTrackRef.current !== currentTrack.id) {
        resolvingTrackRef.current = currentTrack.id;
        setPlaybackError('Resolving playable source...');
        void ensureRemotePlaybackTrack(currentTrack, token ?? undefined)
          .then((resolvedTrack) => {
            resolvingTrackRef.current = null;
            setCurrentTrack(resolvedTrack);
          })
          .catch(() => {
            resolvingTrackRef.current = null;
            setPlaybackError('This track does not have a playable audio source yet.');
          });
        return;
      }

      player.pause();
      setPlaybackStatus({ currentTime: 0, durationSeconds: 0, isBuffering: false });
      if (currentTrack) {
        setPlaybackError('This track does not have a playable audio source yet.');
      } else {
        setPlaybackError(null);
      }
      lastLoadedKeyRef.current = null;
      return;
    }

    resolvingTrackRef.current = null;
    void setIsAudioActiveAsync(true).catch(() => {
      // Ignore activation failures so playback can continue where supported.
    });

    if (metadata) {
      player.setActiveForLockScreen(true, metadata, {
        showSeekBackward: true,
        showSeekForward: true,
      });
      player.updateLockScreenMetadata(metadata);
    }

    if (lastLoadedKeyRef.current !== playbackKey) {
      player.replace({
        uri: currentTrack.playbackUri,
        name: `${currentTrack.artist} - ${currentTrack.title}`,
      });
      lastLoadedKeyRef.current = playbackKey;
      setPlaybackStatus({ currentTime: 0, durationSeconds: 0, isBuffering: true });
      setPlaybackError(null);
    }

    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [currentTrack, isPlaying, playbackKey, setCurrentTrack, setPlaybackError, setPlaybackStatus, token]);

  return children;
}
