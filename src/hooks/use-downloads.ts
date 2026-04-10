import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

import { apiGet } from '../services/api/client';
import { buildDownloadTarget, loadDownloadRegistry, saveDownloadRegistry } from '../services/downloads/registry';
import { isDownloadActive, pauseResumableDownload, startResumableDownload } from '../services/downloads/resumable';
import { useAuthStore } from '../store/auth-store';
import { useDownloadStore } from '../store/download-store';
import { DownloadRecord } from '../types/downloads';
import { Track } from '../types/music';

type DownloadResponse = {
  success?: boolean;
  download_url?: string;
  quality?: string;
  file_size?: number;
};

function buildRecord(track: Track, payload: { sourceUrl: string; quality?: string; fileSize?: number }, existing?: DownloadRecord): DownloadRecord {
  const fileName = existing?.fileName ?? `${track.artist}-${track.title}.mp3`;

  return {
    id: existing?.id ?? `${track.id}-${Date.now()}`,
    track,
    localUri: existing?.localUri ?? buildDownloadTarget(fileName),
    sourceUrl: payload.sourceUrl,
    fileName,
    downloadedAt: existing?.downloadedAt ?? new Date().toISOString(),
    fileSize: payload.fileSize ?? existing?.fileSize,
    quality: payload.quality ?? existing?.quality,
    status: existing?.status ?? 'paused',
    progress: existing?.progress ?? 0,
    resumeData: existing?.resumeData ?? null,
    error: existing?.error ?? null,
  };
}

async function persistFromStore() {
  const downloads = useDownloadStore.getState().downloads;
  await saveDownloadRegistry(downloads);
}

function syncDownloadToStore(record: DownloadRecord) {
  useDownloadStore.getState().addDownload(record);
}

export function useDownloadBootstrap() {
  const hydrated = useDownloadStore((state) => state.hydrated);
  const setDownloads = useDownloadStore((state) => state.setDownloads);

  useEffect(() => {
    if (hydrated) {
      return;
    }

    void loadDownloadRegistry().then((downloads) => {
      const normalized = downloads.map((download) =>
        download.status === 'downloading'
          ? {
              ...download,
              status: 'paused' as const,
              error: download.error ?? 'Download paused after app restart.',
            }
          : download
      );
      setDownloads(normalized);
    });
  }, [hydrated, setDownloads]);
}

export function useDownloadTrack() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');

  return useMutation({
    mutationFn: async (track: Track) => {
      if (!isAuthenticated || !token || !track.sourceId) {
        throw new Error('Sign in to download songs for offline playback.');
      }

      const existing = useDownloadStore
        .getState()
        .downloads.find((item) =>
          typeof item.track.sourceId === 'number' && typeof track.sourceId === 'number'
            ? item.track.sourceId === track.sourceId
            : item.track.id === track.id
        );

      if (existing?.status === 'completed') {
        return existing;
      }

      const response =
        existing?.sourceUrl
          ? { download_url: existing.sourceUrl, quality: existing.quality, file_size: existing.fileSize }
          : await apiGet<DownloadResponse>(`/mobile/downloads/song/${track.sourceId}`, token);

      if (!response.download_url) {
        throw new Error('Download URL was not returned by the server.');
      }

      const record = buildRecord(
        track,
        { sourceUrl: response.download_url, quality: response.quality, fileSize: response.file_size },
        existing
      );

      syncDownloadToStore({
        ...record,
        status: 'downloading',
        error: null,
      });
      await persistFromStore();

      try {
        const uri = await startResumableDownload({
          id: record.id,
          sourceUrl: record.sourceUrl!,
          localUri: record.localUri,
          resumeData: record.resumeData,
          onProgress: (progress) => {
            useDownloadStore.getState().updateDownload(record.id, {
              progress,
              status: 'downloading',
              error: null,
            });
          },
        });

        const completedRecord: DownloadRecord = {
          ...record,
          localUri: uri,
          status: 'completed',
          progress: 1,
          resumeData: null,
          error: null,
          downloadedAt: new Date().toISOString(),
        };

        syncDownloadToStore(completedRecord);
        await persistFromStore();
        return completedRecord;
      } catch (error) {
        const failedRecord: DownloadRecord = {
          ...record,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Download failed.',
        };

        syncDownloadToStore(failedRecord);
        await persistFromStore();
        throw error;
      }
    },
  });
}

export function usePauseDownload() {
  return useMutation({
    mutationFn: async (download: DownloadRecord) => {
      const resumeData = isDownloadActive(download.id) ? await pauseResumableDownload(download.id) : download.resumeData ?? null;
      const pausedRecord: DownloadRecord = {
        ...download,
        status: 'paused',
        resumeData,
        error: null,
      };

      syncDownloadToStore(pausedRecord);
      await persistFromStore();
      return pausedRecord;
    },
  });
}

export function useDownloadedTrackIds() {
  return useDownloadStore((state) =>
    new Set(
      state.downloads
        .filter((item) => item.status === 'completed')
        .map((item) => (typeof item.track.sourceId === 'number' ? `source:${item.track.sourceId}` : `id:${item.track.id}`))
    )
  );
}
