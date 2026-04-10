import { Track } from './music';

export type DownloadStatus = 'downloading' | 'paused' | 'failed' | 'completed';

export type DownloadRecord = {
  id: string;
  track: Track;
  localUri: string;
  sourceUrl?: string;
  fileName?: string;
  downloadedAt: string;
  fileSize?: number;
  quality?: string;
  status: DownloadStatus;
  progress: number;
  resumeData?: string | null;
  error?: string | null;
};
