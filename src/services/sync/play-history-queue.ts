import * as FileSystem from 'expo-file-system/legacy';

import { apiPost } from '../api/client';
import { readJsonPersistence, writeJsonPersistence } from '../storage/json-persistence';

const SYNC_DIR = `${FileSystem.documentDirectory}sync`;
const PLAY_HISTORY_QUEUE_PATH = `${SYNC_DIR}/play-history.json`;
const PLAY_HISTORY_WEB_KEY = 'tesotunes.sync.play-history';

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

export async function loadQueuedPlayHistory(): Promise<QueuedPlayHistoryItem[]> {
  return readJsonPersistence<QueuedPlayHistoryItem[]>({
    webKey: PLAY_HISTORY_WEB_KEY,
    filePath: PLAY_HISTORY_QUEUE_PATH,
    directoryPath: SYNC_DIR,
    fallback: [],
  });
}

async function saveQueuedPlayHistory(items: QueuedPlayHistoryItem[]) {
  await writeJsonPersistence<QueuedPlayHistoryItem[]>(
    {
      webKey: PLAY_HISTORY_WEB_KEY,
      filePath: PLAY_HISTORY_QUEUE_PATH,
      directoryPath: SYNC_DIR,
      fallback: [],
    },
    items
  );
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
