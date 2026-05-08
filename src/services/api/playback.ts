import { apiGet } from './client';
import { Track } from '../../types/music';

type StreamUrlResponse = {
  url?: string;
  track?: {
    duration_formatted?: string | null;
    artwork_url?: string | null;
    artist_name?: string | null;
  } | null;
};

export async function fetchTrackStreamUrl(songId: number, token?: string) {
  const response = await apiGet<StreamUrlResponse>(`/tracks/${songId}/stream-url`, token);

  if (!response.url) {
    throw new Error('The API did not return a playable stream URL.');
  }

  return response;
}

export async function ensureRemotePlaybackTrack(track: Track, token?: string): Promise<Track> {
  if (track.playbackSource === 'offline' || track.playbackUri || !track.sourceId) {
    return track;
  }

  const response = await fetchTrackStreamUrl(track.sourceId, token);

  return {
    ...track,
    duration: response.track?.duration_formatted || track.duration,
    playbackUri: response.url,
    playbackSource: 'remote',
  };
}
