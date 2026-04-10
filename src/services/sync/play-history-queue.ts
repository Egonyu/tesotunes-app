import * as FileSystem from 'expo-file-system/legacy';

import { apiPost } from '../api/client';

const SYNC_DIR = `${FileSystem.documentDirectory}sync`;
const PLAY_HISTORY_QUEUE_PATH = `${SYNC_DIR}/play-history.json`;

export type QueuedPlayHistoryItem = {
  id: string;
  songId: number;
  playedAt: string;
  durationPlayed: number;
  completed: boolean;
};

type PlayHistorySyncResponse = {
  success?: boolean;
  synced?: number;
  total?: number;
  errors?: Array<Record<string, unknown>>;
};

async function ensureSyncDir() {
  const info = await FileSystem.getInfoAsync(SYNC_DIR);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SYNC_DIR, { intermediates: true });
  }
}

export async function loadQueuedPlayHistory(): Promise<QueuedPlayHistoryItem[]> {
  await ensureSyncDir();
  const info = await FileSystem.getInfoAsync(PLAY_HISTORY_QUEUE_PATH);

  if (!info.exists) {
    return [];
  }

  const content = await FileSystem.readAsStringAsync(PLAY_HISTORY_QUEUE_PATH);

  try {
    return JSON.parse(content) as QueuedPlayHistoryItem[];
  } catch {
    return [];
  }
}

async function saveQueuedPlayHistory(items: QueuedPlayHistoryItem[]) {
  await ensureSyncDir();
  await FileSystem.writeAsStringAsync(PLAY_HISTORY_QUEUE_PATH, JSON.stringify(items));
}

export async function enqueuePlayHistoryItem(input: Omit<QueuedPlayHistoryItem, 'id'>) {
  const current = await loadQueuedPlayHistory();
  const nextItem: QueuedPlayHistoryItem = {
    ...input,
    id: `${input.songId}:${input.playedAt}`,
  };
  const deduped = [...current.filter((item) => item.id !== nextItem.id), nextItem].sort((left, right) =>
    left.playedAt.localeCompare(right.playedAt)
  );

  await saveQueuedPlayHistory(deduped);
  return deduped;
}

export async function flushQueuedPlayHistory(token: string) {
  const queued = await loadQueuedPlayHistory();

  if (queued.length === 0) {
    return { flushed: 0 };
  }

  const payload = {
    plays: queued.map((item) => ({
      song_id: item.songId,
      played_at: item.playedAt,
      duration_played: item.durationPlayed,
      completed: item.completed,
    })),
  };

  const response = await apiPost<PlayHistorySyncResponse, typeof payload>('/mobile/sync/play-history', payload, token);

  if (response.success === false) {
    throw new Error('Failed to flush queued play history.');
  }

  await saveQueuedPlayHistory([]);
  return { flushed: queued.length, response };
}
