import { create } from 'zustand';

import { DownloadRecord } from '../types/downloads';

type DownloadState = {
  hydrated: boolean;
  downloads: DownloadRecord[];
  setDownloads: (downloads: DownloadRecord[]) => void;
  addDownload: (download: DownloadRecord) => void;
  updateDownload: (id: string, updater: Partial<DownloadRecord> | ((download: DownloadRecord) => DownloadRecord)) => void;
};

export const useDownloadStore = create<DownloadState>((set) => ({
  hydrated: false,
  downloads: [],
  setDownloads: (downloads) => set({ downloads, hydrated: true }),
  addDownload: (download) =>
    set((state) => ({
      hydrated: true,
      downloads: [download, ...state.downloads.filter((item) => item.track.id !== download.track.id)],
    })),
  updateDownload: (id, updater) =>
    set((state) => ({
      downloads: state.downloads.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return typeof updater === 'function' ? updater(item) : { ...item, ...updater };
      }),
    })),
}));
