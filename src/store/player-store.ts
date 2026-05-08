import { create } from 'zustand';

import { Track } from '../types/music';

export type RepeatMode = 'off' | 'all' | 'one';

type PlayerState = {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  durationSeconds: number;
  isBuffering: boolean;
  playbackError: string | null;
  repeatMode: RepeatMode;
  playTrack: (track: Track, queue?: Track[]) => void;
  replaceQueue: (payload: { currentTrack: Track | null; queue: Track[]; isPlaying?: boolean }) => void;
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (value: boolean) => void;
  setPlaybackStatus: (payload: { currentTime?: number; durationSeconds?: number; isBuffering?: boolean }) => void;
  setPlaybackError: (message: string | null) => void;
  togglePlayback: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
};

function nextIndex(queue: Track[], currentTrack: Track | null) {
  const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
  return currentIndex === -1 ? 0 : (currentIndex + 1) % queue.length;
}

function previousIndex(queue: Track[], currentTrack: Track | null) {
  const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
  if (currentIndex <= 0) {
    return queue.length - 1;
  }

  return currentIndex - 1;
}

const REPEAT_CYCLE: RepeatMode[] = ['off', 'all', 'one'];

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  durationSeconds: 0,
  isBuffering: false,
  playbackError: null,
  repeatMode: 'off',
  playTrack: (track, queue) =>
    set({
      currentTrack: track,
      queue: queue && queue.length > 0 ? queue : get().queue,
      isPlaying: true,
      currentTime: 0,
      durationSeconds: 0,
      playbackError: null,
    }),
  replaceQueue: ({ currentTrack, queue, isPlaying }) =>
    set({
      currentTrack,
      queue,
      isPlaying: isPlaying ?? get().isPlaying,
      currentTime: currentTrack?.id === get().currentTrack?.id ? get().currentTime : 0,
      durationSeconds: currentTrack?.id === get().currentTrack?.id ? get().durationSeconds : 0,
      playbackError: null,
    }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (value) => set({ isPlaying: value }),
  setPlaybackStatus: ({ currentTime, durationSeconds, isBuffering }) =>
    set((state) => ({
      currentTime: currentTime ?? state.currentTime,
      durationSeconds: durationSeconds ?? state.durationSeconds,
      isBuffering: isBuffering ?? state.isBuffering,
    })),
  setPlaybackError: (message) => set({ playbackError: message }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleRepeat: () =>
    set((state) => ({
      repeatMode: REPEAT_CYCLE[(REPEAT_CYCLE.indexOf(state.repeatMode) + 1) % REPEAT_CYCLE.length],
    })),
  playNext: () => {
    const { queue, currentTrack } = get();
    if (queue.length === 0) return;
    set({ currentTrack: queue[nextIndex(queue, currentTrack)], isPlaying: true, currentTime: 0, durationSeconds: 0, playbackError: null });
  },
  playPrevious: () => {
    const { queue, currentTrack } = get();
    if (queue.length === 0) return;
    set({ currentTrack: queue[previousIndex(queue, currentTrack)], isPlaying: true, currentTime: 0, durationSeconds: 0, playbackError: null });
  },
}));
