import * as FileSystem from 'expo-file-system/legacy';

import { DownloadRecord } from '../../types/downloads';

const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads`;
const REGISTRY_PATH = `${DOWNLOADS_DIR}/registry.json`;

async function ensureDownloadsDir() {
  const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
}

export async function loadDownloadRegistry(): Promise<DownloadRecord[]> {
  await ensureDownloadsDir();
  const info = await FileSystem.getInfoAsync(REGISTRY_PATH);

  if (!info.exists) {
    return [];
  }

  const content = await FileSystem.readAsStringAsync(REGISTRY_PATH);

  try {
    return (JSON.parse(content) as DownloadRecord[]).map((download) => ({
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
  await ensureDownloadsDir();
  await FileSystem.writeAsStringAsync(REGISTRY_PATH, JSON.stringify(downloads));
}

export function buildDownloadTarget(fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
  return `${DOWNLOADS_DIR}/${sanitized}`;
}

export async function downloadFileToDevice(sourceUrl: string, fileName: string) {
  await ensureDownloadsDir();
  const target = buildDownloadTarget(fileName);
  const result = await FileSystem.downloadAsync(sourceUrl, target);

  return result.uri;
}
