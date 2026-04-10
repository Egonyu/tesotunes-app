import { DownloadRecord } from '../../types/downloads';
import { Track } from '../../types/music';

function matchesTrack(download: DownloadRecord, track: Track) {
  if (typeof download.track.sourceId === 'number' && typeof track.sourceId === 'number') {
    return download.track.sourceId === track.sourceId;
  }

  return download.track.id === track.id;
}

export function resolveTrackPlayback(track: Track, downloads: DownloadRecord[]): Track {
  const download = downloads.find((item) => item.status === 'completed' && matchesTrack(item, track));

  if (!download) {
    return {
      ...track,
      playbackUri: track.playbackUri ?? null,
      playbackSource: 'remote',
    };
  }

  return {
    ...track,
    playbackUri: download.localUri,
    playbackSource: 'offline',
    artworkUrl: track.artworkUrl ?? download.track.artworkUrl ?? null,
  };
}

export function resolveQueuePlayback(queue: Track[], downloads: DownloadRecord[]) {
  return queue.map((track) => resolveTrackPlayback(track, downloads));
}
