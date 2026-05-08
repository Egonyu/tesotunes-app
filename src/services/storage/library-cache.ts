import * as FileSystem from 'expo-file-system/legacy';

import { readJsonPersistence, writeJsonPersistence } from './json-persistence';

const CACHE_DIR = `${FileSystem.documentDirectory}media`;
const LIBRARY_CACHE_PATH = `${CACHE_DIR}/library-cache.json`;
const LIBRARY_CACHE_WEB_KEY = 'tesotunes.library.cache';

type LibraryCache = {
  likedTrackIds: string[];
  followedArtistIds: string[];
};

const FALLBACK: LibraryCache = { likedTrackIds: [], followedArtistIds: [] };

const OPTIONS = {
  webKey: LIBRARY_CACHE_WEB_KEY,
  filePath: LIBRARY_CACHE_PATH,
  directoryPath: CACHE_DIR,
  fallback: FALLBACK,
};

export async function loadLibraryCache(): Promise<LibraryCache> {
  return readJsonPersistence<LibraryCache>(OPTIONS);
}

export async function saveLibraryCache(likedTrackIds: string[], followedArtistIds: string[]): Promise<void> {
  await writeJsonPersistence<LibraryCache>(OPTIONS, { likedTrackIds, followedArtistIds });
}
