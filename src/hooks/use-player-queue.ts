import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { seekActivePlayerTo } from '../providers/audio-playback-provider';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api/client';
import { ensureRemotePlaybackTrack } from '../services/api/playback';
import { resolveQueuePlayback, resolveTrackPlayback } from '../services/downloads/playback';
import { pushRecentTrack } from '../services/media/recent-tracks';
import { enqueuePlayHistoryItem } from '../services/sync/play-history-queue';
import { mapQueue, mapQueueSong } from '../services/api/mappers';
import { useAuthStore } from '../store/auth-store';
import { useDownloadStore } from '../store/download-store';
import { usePlayerStore } from '../store/player-store';
import { QueueItem, QueueSong } from '../types/api';
import { Track } from '../types/music';

type QueueResponse = {
  success?: boolean;
  data?: {
    queue?: QueueItem[];
    current_playing?: QueueItem | null;
    total_duration_seconds?: number;
    remaining_duration_seconds?: number;
  };
};

type PlayerStatusResponse = {
  data?: {
    is_playing?: boolean;
    current_song?: QueueSong | null;
  };
};

type PlayerTransportResponse = {
  data?: {
    song?: QueueSong | null;
    queue_item?: QueueItem | null;
    player_state?: {
      is_playing?: boolean;
    } | null;
  };
};

function nextTrackIndex(queue: Track[], currentTrack: Track | null) {
  const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
  return currentIndex === -1 ? 0 : (currentIndex + 1) % queue.length;
}

function previousTrackIndex(queue: Track[], currentTrack: Track | null) {
  const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
  if (currentIndex <= 0) {
    return queue.length - 1;
  }

  return currentIndex - 1;
}

export function usePlayerQueueSync() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const replaceQueue = usePlayerStore((state) => state.replaceQueue);
  const downloads = useDownloadStore((state) => state.downloads);

  const queueQuery = useQuery({
    queryKey: ['player-queue'],
    queryFn: async () => {
      const [queueResponse, statusResponse] = await Promise.all([
        apiGet<QueueResponse>('/player/queue', token ?? undefined),
        apiGet<PlayerStatusResponse>('/player/status', token ?? undefined),
      ]);

      const { queue, currentTrack } = mapQueue(queueResponse.data?.queue);

      const resolvedQueue = resolveQueuePlayback(queue, downloads);
      const resolvedCurrentTrack = currentTrack ? resolveTrackPlayback(currentTrack, downloads) : null;
      const localPlayerState = usePlayerStore.getState();
      const preservePlaying =
        localPlayerState.isPlaying &&
        !!resolvedCurrentTrack &&
        localPlayerState.currentTrack?.id === resolvedCurrentTrack.id;

      return {
        queue: resolvedQueue,
        currentTrack: resolvedCurrentTrack,
        isPlaying: preservePlaying ? true : (statusResponse.data?.is_playing ?? localPlayerState.isPlaying),
        queueItems: resolvedQueue,
        totalDurationSeconds: queueResponse.data?.total_duration_seconds ?? 0,
        remainingDurationSeconds: queueResponse.data?.remaining_duration_seconds ?? 0,
      };
    },
    enabled: isAuthenticated && !!token,
    staleTime: 15 * 1000,
  });

  useEffect(() => {
    if (queueQuery.data) {
      replaceQueue(queueQuery.data);
    }
  }, [queueQuery.data, replaceQueue]);

  return queueQuery;
}

export function useAddToQueue() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: number) => {
      if (!isAuthenticated || !token) {
        throw new Error('Please sign in to add songs to your queue.');
      }

      return apiPost('/player/queue', { type: 'song', id: songId, position: 'last' }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-queue'] });
    },
  });
}

export function useQueueManagement() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();

  function requireSession() {
    if (!isAuthenticated || !token) {
      throw new Error('Please sign in to manage your queue.');
    }
  }

  const invalidateQueue = () => {
    queryClient.invalidateQueries({ queryKey: ['player-queue'] });
  };

  const clearQueue = useMutation({
    mutationFn: async () => {
      requireSession();
      return apiDelete('/player/queue', token!);
    },
    onSuccess: invalidateQueue,
  });

  const shuffleQueue = useMutation({
    mutationFn: async () => {
      requireSession();
      return apiPost('/player/queue/shuffle', {}, token!);
    },
    onSuccess: invalidateQueue,
  });

  const removeFromQueue = useMutation({
    mutationFn: async (queueItemId: number) => {
      requireSession();
      return apiDelete(`/player/queue/${queueItemId}`, token!);
    },
    onSuccess: invalidateQueue,
  });

  const reorderQueue = useMutation({
    mutationFn: async (queueItems: Array<{ id: number; position: number }>) => {
      requireSession();
      return apiPut('/player/queue/reorder', { queue_items: queueItems }, token!);
    },
    onSuccess: invalidateQueue,
  });

  return {
    clearQueue,
    shuffleQueue,
    removeFromQueue,
    reorderQueue,
    queueActionLoading:
      clearQueue.isPending || shuffleQueue.isPending || removeFromQueue.isPending || reorderQueue.isPending,
  };
}

export function usePlayerControls() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const queue = usePlayerStore((state) => state.queue);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const durationSeconds = usePlayerStore((state) => state.durationSeconds);
  const togglePlaybackLocal = usePlayerStore((state) => state.togglePlayback);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setPlaybackStatus = usePlayerStore((state) => state.setPlaybackStatus);
  const setPlaybackError = usePlayerStore((state) => state.setPlaybackError);
  const downloads = useDownloadStore((state) => state.downloads);
  const queryClient = useQueryClient();
  const lastSyncedRef = useRef<string | null>(null);
  const lastRecordedTrackRef = useRef<string | null>(null);

  async function activateTrack(track: Track, nextQueue = queue) {
    if (track.playbackSource === 'offline' || track.playbackUri) {
      const normalizedQueue = nextQueue.map((queueTrack) => (queueTrack.id === track.id ? track : queueTrack));
      setCurrentTrack(track);
      usePlayerStore.setState({ queue: normalizedQueue });
      setIsPlaying(true);
      setPlaybackError(null);
      void pushRecentTrack(track).then(() => {
        queryClient.invalidateQueries({ queryKey: ['user-library'] });
      });
      return true;
    }

    if (!track.sourceId) {
      setPlaybackError('This track does not have a playable audio source yet.');
      return false;
    }

    try {
      const resolvedTrack = await ensureRemotePlaybackTrack(track, token ?? undefined);
      const normalizedQueue = nextQueue.map((queueTrack) => (queueTrack.id === track.id ? resolvedTrack : queueTrack));
      setCurrentTrack(resolvedTrack);
      usePlayerStore.setState({ queue: normalizedQueue });
      setIsPlaying(true);
      setPlaybackError(null);
      void pushRecentTrack(resolvedTrack).then(() => {
        queryClient.invalidateQueries({ queryKey: ['user-library'] });
      });
      return true;
    } catch {
      setPlaybackError('This track does not have a playable audio source yet.');
      return false;
    }
  }

  const nextMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !token) {
        return null;
      }

      return apiPost<PlayerTransportResponse>('/player/next', {}, token);
    },
    onSuccess: async (response) => {
      const transportSong = response?.data?.song;
      if (transportSong) {
        const mappedTrack = resolveTrackPlayback(mapQueueSong(transportSong, 0), downloads);
        await activateTrack(mappedTrack);
        queryClient.invalidateQueries({ queryKey: ['player-queue'] });
      }
    },
  });

  const previousMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !token) {
        return null;
      }

      return apiPost<PlayerTransportResponse>('/player/previous', {}, token);
    },
    onSuccess: async (response) => {
      const transportSong = response?.data?.song;
      if (transportSong) {
        const mappedTrack = resolveTrackPlayback(mapQueueSong(transportSong, 0), downloads);
        await activateTrack(mappedTrack);
        queryClient.invalidateQueries({ queryKey: ['player-queue'] });
      }
    },
  });

  const togglePlayback = () => {
    togglePlaybackLocal();
  };

  function resolvePlaybackErrorMessage(error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Audio file not available')) {
        return 'This track does not have a playable audio source yet.';
      }

      return error.message;
    }

    return 'Playback action failed. Please try another track.';
  }

  function runMutationSafely(action: Promise<unknown>) {
    void action.catch((error) => {
      setPlaybackError(resolvePlaybackErrorMessage(error));
    });
  }

  function moveToLocalQueueTrack(direction: 'next' | 'previous') {
    if (queue.length === 0) {
      return;
    }

    const targetIndex = direction === 'next' ? nextTrackIndex(queue, currentTrack) : previousTrackIndex(queue, currentTrack);
    const targetTrack = queue[targetIndex];
    if (!targetTrack) {
      return;
    }

    runMutationSafely(activateTrack(targetTrack, queue));
  }

  function moveToLocalQueueTrackWithFallback(direction: 'next' | 'previous', error?: unknown) {
    const fallbackMessage =
      direction === 'next'
        ? 'Server skip failed, using local queue.'
        : 'Server previous failed, using local queue.';

    setPlaybackError(error ? `${resolvePlaybackErrorMessage(error)} ${fallbackMessage}` : fallbackMessage);
    moveToLocalQueueTrack(direction);
  }

  useEffect(() => {
    if (currentTrack?.id !== lastRecordedTrackRef.current && currentTrack?.sourceId) {
      lastRecordedTrackRef.current = null;
    }
  }, [currentTrack?.id, currentTrack?.sourceId]);

  const seekMutation = useMutation({
    mutationFn: async (targetSeconds: number) => {
      const clamped = Math.max(0, durationSeconds > 0 ? Math.min(targetSeconds, durationSeconds) : targetSeconds);
      await seekActivePlayerTo(clamped);

      if (isAuthenticated && token && currentTrack?.sourceId) {
        await apiPost('/player/seek', { position: Math.floor(clamped) }, token);
      }

      return clamped;
    },
    onSuccess: (nextTime) => {
      setPlaybackStatus({ currentTime: nextTime });
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !token || !currentTrack?.sourceId) {
      lastSyncedRef.current = null;
      return;
    }

    const position = Math.floor(currentTime);
    const progressBucket = isPlaying ? Math.floor(position / 10) : position;
    const snapshotKey = `${currentTrack.sourceId}:${isPlaying}:${progressBucket}`;
    if (lastSyncedRef.current === snapshotKey) {
      return;
    }

    lastSyncedRef.current = snapshotKey;

    void apiPost(
      '/player/update-now-playing',
      {
        song_id: currentTrack.sourceId,
        is_playing: isPlaying,
        position,
        play_duration_seconds: 0,
        device_type: 'mobile',
      },
      token
    ).catch(() => {
      lastSyncedRef.current = null;
    });
  }, [currentTime, currentTrack?.sourceId, isAuthenticated, isPlaying, token]);

  useEffect(() => {
    if (!isAuthenticated || !token || !currentTrack?.sourceId || durationSeconds <= 0) {
      return;
    }

    const position = Math.floor(currentTime);
    const completionRatio = durationSeconds > 0 ? position / durationSeconds : 0;
    const qualified = position >= 30 || completionRatio >= 0.3;
    const currentSongId = currentTrack.sourceId;

    if (!qualified || lastRecordedTrackRef.current === currentTrack.id) {
      return;
    }

    lastRecordedTrackRef.current = currentTrack.id;

    void apiPost(
      '/player/record-play',
      {
        song_id: currentTrack.sourceId,
        duration_played: position,
        total_duration: Math.floor(durationSeconds),
        completed: completionRatio >= 0.95,
        timestamp: Date.now(),
      },
      token
    )
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['user-library'] });
      })
      .catch((error) => {
        if (error instanceof Error && error.message.includes('Network request failed')) {
          void enqueuePlayHistoryItem({
            songId: currentSongId,
            playedAt: new Date().toISOString(),
            durationPlayed: position,
            completed: completionRatio >= 0.95,
          });
          return;
        }

        lastRecordedTrackRef.current = null;
      });
  }, [currentTime, currentTrack?.id, currentTrack?.sourceId, durationSeconds, isAuthenticated, queryClient, token]);

  useEffect(() => {
    if (!isAuthenticated || !token || !currentTrack?.sourceId || queue.length === 0) {
      return;
    }

    const existsInQueue = queue.some((track) => track.sourceId === currentTrack.sourceId);
    if (existsInQueue) {
      return;
    }

    void apiPost('/player/queue', { type: 'song', id: currentTrack.sourceId, position: 'last' }, token)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['player-queue'] });
      })
      .catch(() => {
        // Ignore queue seeding errors so playback still works locally.
      });
  }, [currentTrack?.sourceId, isAuthenticated, queue, queryClient, token]);

  return {
    next: () =>
      isAuthenticated && token
        ? void nextMutation.mutateAsync().catch((error) => {
            moveToLocalQueueTrackWithFallback('next', error);
          })
        : moveToLocalQueueTrack('next'),
    previous: () =>
      isAuthenticated && token
        ? void previousMutation.mutateAsync().catch((error) => {
            moveToLocalQueueTrackWithFallback('previous', error);
          })
        : moveToLocalQueueTrack('previous'),
    seekTo: (seconds: number) => runMutationSafely(seekMutation.mutateAsync(seconds)),
    seekBackward: () => runMutationSafely(seekMutation.mutateAsync(Math.max(0, currentTime - 10))),
    seekForward: () => runMutationSafely(seekMutation.mutateAsync(durationSeconds > 0 ? Math.min(durationSeconds, currentTime + 10) : currentTime + 10)),
    togglePlayback,
    controlsLoading: nextMutation.isPending || previousMutation.isPending || seekMutation.isPending,
  };
}
