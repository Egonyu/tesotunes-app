import * as FileSystem from 'expo-file-system/legacy';

import { apiPost } from '../api/client';

const SYNC_DIR = `${FileSystem.documentDirectory}sync`;
const USER_ACTION_QUEUE_PATH = `${SYNC_DIR}/user-actions.json`;

type QueuedLikeAction = {
  id: string;
  type: 'like';
  songId: number;
  action: 'like' | 'unlike';
  timestamp: string;
};

type QueuedFollowAction = {
  id: string;
  type: 'follow';
  artistId: number;
  action: 'follow' | 'unfollow';
  timestamp: string;
};

export type QueuedUserAction = QueuedLikeAction | QueuedFollowAction;
type QueuedUserActionInput = Omit<QueuedLikeAction, 'id' | 'timestamp'> | Omit<QueuedFollowAction, 'id' | 'timestamp'>;

type UserActionSyncResponse = {
  success?: boolean;
  results?: {
    likes_synced?: number;
    follows_synced?: number;
    errors?: Array<Record<string, unknown>>;
  };
};

async function ensureSyncDir() {
  const info = await FileSystem.getInfoAsync(SYNC_DIR);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SYNC_DIR, { intermediates: true });
  }
}

export async function loadQueuedUserActions(): Promise<QueuedUserAction[]> {
  await ensureSyncDir();
  const info = await FileSystem.getInfoAsync(USER_ACTION_QUEUE_PATH);

  if (!info.exists) {
    return [];
  }

  const content = await FileSystem.readAsStringAsync(USER_ACTION_QUEUE_PATH);

  try {
    return JSON.parse(content) as QueuedUserAction[];
  } catch {
    return [];
  }
}

async function saveQueuedUserActions(actions: QueuedUserAction[]) {
  await ensureSyncDir();
  await FileSystem.writeAsStringAsync(USER_ACTION_QUEUE_PATH, JSON.stringify(actions));
}

function dedupeActions(actions: QueuedUserAction[]) {
  const latestByKey = new Map<string, QueuedUserAction>();

  for (const action of actions) {
    const key = action.type === 'like' ? `like:${action.songId}` : `follow:${action.artistId}`;
    latestByKey.set(key, action);
  }

  return Array.from(latestByKey.values()).sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export async function enqueueUserAction(action: QueuedUserActionInput) {
  const current = await loadQueuedUserActions();
  const timestamp = new Date().toISOString();
  const queuedAction: QueuedUserAction =
    action.type === 'like'
      ? {
          ...action,
          id: `${action.type}:${action.songId}:${Date.now()}`,
          timestamp,
        }
      : {
          ...action,
          id: `${action.type}:${action.artistId}:${Date.now()}`,
          timestamp,
        };

  const deduped = dedupeActions([...current, queuedAction]);
  await saveQueuedUserActions(deduped);

  return deduped;
}

export async function flushQueuedUserActions(token: string) {
  const queued = await loadQueuedUserActions();

  if (queued.length === 0) {
    return { flushed: 0 };
  }

  const payload = {
    likes: queued
      .filter((action): action is QueuedLikeAction => action.type === 'like')
      .map((action) => ({
        song_id: action.songId,
        action: action.action,
        timestamp: action.timestamp,
      })),
    follows: queued
      .filter((action): action is QueuedFollowAction => action.type === 'follow')
      .map((action) => ({
        artist_id: action.artistId,
        action: action.action,
        timestamp: action.timestamp,
      })),
  };

  const response = await apiPost<UserActionSyncResponse, typeof payload>('/mobile/sync/user-actions', payload, token);

  if (response.success === false) {
    throw new Error('Failed to flush queued user actions.');
  }

  await saveQueuedUserActions([]);

  return { flushed: queued.length, response };
}
