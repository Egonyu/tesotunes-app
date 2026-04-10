import * as FileSystem from 'expo-file-system/legacy';

type ProgressHandler = (progress: number) => void;

const activeDownloads = new Map<string, FileSystem.DownloadResumable>();

function createTask(
  id: string,
  sourceUrl: string,
  localUri: string,
  resumeData: string | null | undefined,
  onProgress?: ProgressHandler
) {
  const task = FileSystem.createDownloadResumable(
    sourceUrl,
    localUri,
    {},
    (event) => {
      if (!onProgress || !event.totalBytesExpectedToWrite) {
        return;
      }

      onProgress(event.totalBytesWritten / event.totalBytesExpectedToWrite);
    },
    resumeData ?? undefined
  );

  activeDownloads.set(id, task);
  return task;
}

export async function startResumableDownload(input: {
  id: string;
  sourceUrl: string;
  localUri: string;
  resumeData?: string | null;
  onProgress?: ProgressHandler;
}) {
  const task = createTask(input.id, input.sourceUrl, input.localUri, input.resumeData, input.onProgress);

  try {
    const result = input.resumeData ? await task.resumeAsync() : await task.downloadAsync();
    return result?.uri ?? input.localUri;
  } finally {
    activeDownloads.delete(input.id);
  }
}

export async function pauseResumableDownload(id: string) {
  const task = activeDownloads.get(id);

  if (!task) {
    return null;
  }

  const pauseState = await task.pauseAsync();
  activeDownloads.delete(id);
  return pauseState.resumeData ?? null;
}

export function isDownloadActive(id: string) {
  return activeDownloads.has(id);
}
