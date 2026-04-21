import * as FileSystem from 'expo-file-system/legacy';

import { Track } from '../../types/music';
import { readJsonPersistence, writeJsonPersistence } from '../storage/json-persistence';

const MEDIA_DIR = `${FileSystem.documentDirectory}media`;
const RECENT_TRACKS_PATH = `${MEDIA_DIR}/recent-tracks.json`;
const MAX_RECENT_TRACKS = 20;
const RECENT_TRACKS_WEB_KEY = 'tesotunes.media.recent-tracks';

export async function loadRecentTracks(): Promise<Track[]> {
  return readJsonPersistence<Track[]>({
    webKey: RECENT_TRACKS_WEB_KEY,
    filePath: RECENT_TRACKS_PATH,
    directoryPath: MEDIA_DIR,
    fallback: [],
  });
}

async function saveRecentTracks(tracks: Track[]) {
  await writeJsonPersistence<Track[]>(
    {
      webKey: RECENT_TRACKS_WEB_KEY,
      filePath: RECENT_TRACKS_PATH,
      directoryPath: MEDIA_DIR,
      fallback: [],
    },
    tracks.slice(0, MAX_RECENT_TRACKS)
  );
}

export async function pushRecentTrack(track: Track) {
  const current = await loadRecentTracks();
  const deduped = [track, ...current.filter((item) => item.id !== track.id)];
  await saveRecentTracks(deduped);
  return deduped;
}
