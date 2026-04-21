import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { DownloadRecord } from '../../types/downloads';
import { readJsonPersistence, writeJsonPersistence } from '../storage/json-persistence';

const DOWNLOADS_DIR = Platform.OS === 'web' ? 'downloads' : `${FileSystem.documentDirectory}downloads`;
const REGISTRY_PATH = `${DOWNLOADS_DIR}/registry.json`;
const DOWNLOAD_REGISTRY_WEB_KEY = 'tesotunes.downloads.registry';

export async function loadDownloadRegistry(): Promise<DownloadRecord[]> {
  const content = await readJsonPersistence<DownloadRecord[]>({
    webKey: DOWNLOAD_REGISTRY_WEB_KEY,
    filePath: REGISTRY_PATH,
    directoryPath: DOWNLOADS_DIR,
    fallback: [],
  });

  try {
    return content.map((download) => ({
      ...download,
      status: download.status ?? 'completed',
      progress: typeof download.progress === 'number' ? download.progress : download.status === 'completed' ? 1 : 0,
      resumeData: download.resumeData ?? null,
      error: download.error ?? null,
    }));
  } catch {
    return [];
  }
}

export async function saveDownloadRegistry(downloads: DownloadRecord[]) {
  await writeJsonPersistence<DownloadRecord[]>(
    {
      webKey: DOWNLOAD_REGISTRY_WEB_KEY,
      filePath: REGISTRY_PATH,
      directoryPath: DOWNLOADS_DIR,
      fallback: [],
    },
    downloads
  );
}

export function buildDownloadTarget(fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
  return `${DOWNLOADS_DIR}/${sanitized}`;
}

export async function downloadFileToDevice(sourceUrl: string, fileName: string) {
  if (Platform.OS === 'web') {
    throw new Error('Offline downloads are not supported on web builds.');
  }

  const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }

  const target = buildDownloadTarget(fileName);
  const result = await FileSystem.downloadAsync(sourceUrl, target);

  return result.uri;
}
