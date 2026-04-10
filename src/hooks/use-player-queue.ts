import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { seekActivePlayerTo } from '../providers/audio-playback-provider';
import { apiGet, apiPost } from '../services/api/client';
import { ensureRemotePlaybackTrack } from '../services/api/playback';
import { resolveQueuePlayback, resolveTrackPlayback } from '../services/downloads/playback';
import { enqueuePlayHistoryItem } from '../services/sync/play-history-queue';
import { mapQueue, mapQueueSong } from '../services/api/mappers';
import { useAuthStore } from '../store/auth-store';
import { useDownloadStore } from '../store/download-store';
import { usePlayerStore } from '../store/player-store';
import { QueueItem, QueueSong } from '../types/api';

type QueueResponse = {
  success?: boolean;
  data?: {
    queue?: QueueItem[];
    current_playing?: QueueItem | null;
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

      return {
        queue: resolvedQueue,
        currentTrack: resolvedCurrentTrack,
        isPlaying: statusResponse.data?.is_playing ?? false,
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

export function usePlayerControls() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const queue = usePlayerStore((state) => state.queue);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const durationSeconds = usePlayerStore((state) => state.durationSeconds);
  const playNextLocal = usePlayerStore((state) => state.playNext);
  const playPreviousLocal = usePlayerStore((state) => state.playPrevious);
  const togglePlaybackLocal = usePlayerStore((state) => state.togglePlayback);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setPlaybackStatus = usePlayerStore((state) => state.setPlaybackStatus);
  const downloads = useDownloadStore((state) => state.downloads);
  const queryClient = useQueryClient();
  const lastSyncedRef = useRef<string | null>(null);
  const lastRecordedTrackRef = useRef<string | null>(null);

  const nextMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !token) {
        playNextLocal();
        return null;
      }

      return apiPost<PlayerTransportResponse>('/player/next', {}, token);
    },
    onSuccess: (response) => {
      const transportSong = response?.data?.song;
      if (transportSong) {
        const mappedTrack = resolveTrackPlayback(mapQueueSong(transportSong, 0), downloads);

        void ensureRemotePlaybackTrack(mappedTrack, token ?? undefined)
          .then((track) => {
            setCurrentTrack(track);
            setIsPlaying(true);
            queryClient.invalidateQueries({ queryKey: ['player-queue'] });
          })
          .catch(() => {
            setCurrentTrack(mappedTrack);
            setIsPlaying(true);
            queryClient.invalidateQueries({ queryKey: ['player-queue'] });
          });
      }
    },
  });

  const previousMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !token) {
        playPreviousLocal();
        return null;
      }

      return apiPost<PlayerTransportResponse>('/player/previous', {}, token);
    },
    onSuccess: (response) => {
      const transportSong = response?.data?.song;
      if (transportSong) {
        const mappedTrack = resolveTrackPlayback(mapQueueSong(transportSong, 0), downloads);

        void ensureRemotePlaybackTrack(mappedTrack, token ?? undefined)
          .then((track) => {
            setCurrentTrack(track);
            setIsPlaying(true);
            queryClient.invalidateQueries({ queryKey: ['player-queue'] });
          })
          .catch(() => {
            setCurrentTrack(mappedTrack);
            setIsPlaying(true);
            queryClient.invalidateQueries({ queryKey: ['player-queue'] });
          });
      }
    },
  });

  const togglePlayback = () => {
    togglePlaybackLocal();
  };

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
    ).catch((error) => {
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
  }, [currentTime, currentTrack?.id, currentTrack?.sourceId, durationSeconds, isAuthenticated, token]);

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
    next: () => void nextMutation.mutateAsync(),
    previous: () => void previousMutation.mutateAsync(),
    seekTo: (seconds: number) => void seekMutation.mutateAsync(seconds),
    seekBackward: () => void seekMutation.mutateAsync(Math.max(0, currentTime - 10)),
    seekForward: () => void seekMutation.mutateAsync(durationSeconds > 0 ? Math.min(durationSeconds, currentTime + 10) : currentTime + 10),
    togglePlayback,
    controlsLoading: nextMutation.isPending || previousMutation.isPending || seekMutation.isPending,
  };
}
