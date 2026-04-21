import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

type JsonPersistenceOptions<T> = {
  webKey: string;
  filePath: string;
  directoryPath?: string;
  fallback: T;
};

const webMemoryStore = new Map<string, string>();

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  try {
    const storage = window.localStorage;
    const probeKey = '__tesotunes_storage_probe__';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return null;
  }
}

async function ensureDirectory(path?: string) {
  if (!path || Platform.OS === 'web') {
    return;
  }

  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

export async function readJsonPersistence<T>(options: JsonPersistenceOptions<T>): Promise<T> {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();

    let content: string | null = null;

    if (storage) {
      try {
        content = storage.getItem(options.webKey);

        if (!content) {
          content = webMemoryStore.get(options.webKey) ?? null;
        }
      } catch {
        content = webMemoryStore.get(options.webKey) ?? null;
      }
    } else {
      content = webMemoryStore.get(options.webKey) ?? null;
    }

    if (!content) {
      return options.fallback;
    }

    try {
      return JSON.parse(content) as T;
    } catch {
      return options.fallback;
    }
  }

  await ensureDirectory(options.directoryPath);
  const info = await FileSystem.getInfoAsync(options.filePath);

  if (!info.exists) {
    return options.fallback;
  }

  const content = await FileSystem.readAsStringAsync(options.filePath);

  try {
    return JSON.parse(content) as T;
  } catch {
    return options.fallback;
  }
}

export async function writeJsonPersistence<T>(options: JsonPersistenceOptions<T>, value: T) {
  if (Platform.OS === 'web') {
    const serialized = JSON.stringify(value);
    const storage = getWebStorage();

    if (storage) {
      try {
        storage.setItem(options.webKey, serialized);
        return;
      } catch {
        // Fall back to in-memory storage when browser storage writes fail.
      }
    }

    webMemoryStore.set(options.webKey, serialized);
    return;
  }

  await ensureDirectory(options.directoryPath);
  await FileSystem.writeAsStringAsync(options.filePath, JSON.stringify(value));
}
