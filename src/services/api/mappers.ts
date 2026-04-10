import { albums as fallbackAlbums, artists as fallbackArtists, events as fallbackEvents, featuredTracks, playlists as fallbackPlaylists } from '../../data/mock-content';
import { Album, Artist, EventItem, Playlist, Track } from '../../types/music';
import { ApiListResponse, ApiPlaylist, MobileAlbum, MobileArtist, MobileSong, PublicEvent, QueueItem, QueueSong } from '../../types/api';

function pickPalette(index: number): [string, string] {
  const palettes: Array<[string, string]> = [
    ['#5b2415', '#d49c4d'],
    ['#2a144f', '#e26d5c'],
    ['#093637', '#44a08d'],
    ['#311847', '#915eff'],
    ['#7c2d12', '#f97316'],
    ['#1e3a8a', '#38bdf8'],
  ];

  return palettes[index % palettes.length];
}

function listFromResponse<T>(response: ApiListResponse<T> | undefined): T[] {
  if (!response) return [];
  return Array.isArray(response) ? response : (response.data ?? []);
}

function formatPlays(value?: number | null) {
  if (!value) return 'New on TesoTunes';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M plays`;
  if (value >= 1000) return `${Math.round(value / 1000)}K plays`;
  return `${value} plays`;
}

function formatListeners(value?: number | null) {
  if (!value) return 'Emerging artist';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M monthly listeners`;
  if (value >= 1000) return `${Math.round(value / 1000)}K monthly listeners`;
  return `${value} monthly listeners`;
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Coming soon';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Coming soon';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function mapSongs(response?: ApiListResponse<MobileSong>): Track[] {
  const items = listFromResponse(response);
  if (items.length === 0) return featuredTracks;

  return items.map((song, index) => ({
    id: String(song.id ?? song.slug ?? `track-${index}`),
    sourceId: typeof song.id === 'number' ? song.id : Number(song.id) || undefined,
    title: song.title || song.name || 'Untitled track',
    artist: song.artist_name || song.artist?.name || 'Unknown artist',
    duration: song.duration_formatted || (typeof song.duration === 'string' ? song.duration : '3:20'),
    plays: formatPlays(song.play_count ?? song.stream_count),
    palette: pickPalette(index),
    albumId: song.album_id ? String(song.album_id) : undefined,
    artistId: song.artist?.id ? String(song.artist.id) : undefined,
    artworkUrl: song.artwork_url ?? song.artwork ?? null,
    playbackUri: song.audio_url ?? null,
    playbackSource: song.audio_url ? 'remote' : 'remote',
  }));
}

export function mapQueueSong(song: QueueSong, index: number): Track {
  return {
    id: String(song.id ?? `queue-track-${index}`),
    sourceId: typeof song.id === 'number' ? song.id : Number(song.id) || undefined,
    title: song.title || 'Untitled track',
    artist: song.artist?.name || 'Unknown artist',
    duration: song.duration_formatted || '3:20',
    plays: formatPlays(song.play_count),
    palette: pickPalette(index),
    albumId: song.album?.id ? String(song.album.id) : undefined,
    artistId: song.artist?.id ? String(song.artist.id) : undefined,
    artworkUrl: song.artwork_url ?? song.artwork ?? null,
    playbackUri: song.audio_url ?? null,
    playbackSource: song.audio_url ? 'remote' : 'remote',
  };
}

export function mapQueue(items?: QueueItem[]) {
  const queueItems = items ?? [];
  const queue = queueItems
    .filter((item): item is QueueItem & { song: QueueSong } => Boolean(item.song))
    .map((item, index) => mapQueueSong(item.song!, index));

  const currentItem = queueItems.find((item) => item.is_current && item.song);
  const currentTrack = currentItem?.song ? mapQueueSong(currentItem.song, 0) : queue[0] ?? null;

  return { queue, currentTrack };
}

export function mapArtists(response?: ApiListResponse<MobileArtist>): Artist[] {
  const items = listFromResponse(response);
  if (items.length === 0) return fallbackArtists;

  return items.map((artist, index) => ({
    id: String(artist.id ?? `artist-${index}`),
    sourceId: typeof artist.id === 'number' ? artist.id : Number(artist.id) || undefined,
    name: artist.name || 'Unknown artist',
    monthlyListeners: formatListeners(artist.monthly_listeners ?? artist.followers_count),
    palette: pickPalette(index),
    bio: artist.bio || undefined,
    followerCount: artist.followers_count ?? undefined,
  }));
}

export function mapAlbums(response?: ApiListResponse<MobileAlbum>): Album[] {
  const items = listFromResponse(response);
  if (items.length === 0) return fallbackAlbums;

  return items.map((album, index) => ({
    id: String(album.id ?? `album-${index}`),
    title: album.title || album.name || 'Untitled album',
    artist: album.artist_name || album.artist?.name || 'Unknown artist',
    year: String(album.release_year ?? album.year ?? '2026'),
    palette: pickPalette(index),
    description: album.description || 'Featured release on TesoTunes.',
    tracks: [],
  }));
}

export function mapEvents(response?: ApiListResponse<PublicEvent>): EventItem[] {
  const items = listFromResponse(response);
  if (items.length === 0) return fallbackEvents;

  return items.map((event, index) => ({
    id: String(event.id ?? `event-${index}`),
    title: event.title || 'Untitled event',
    venue: event.venue_name || 'TBA venue',
    dateLabel: formatDateLabel(event.starts_at || event.start_date),
    city: event.city || 'Uganda',
    palette: pickPalette(index + 2),
  }));
}

export function mapPlaylists(response?: ApiListResponse<ApiPlaylist>): Playlist[] {
  const items = listFromResponse(response);
  if (items.length === 0) return fallbackPlaylists;

  return items.map((playlist, index) => ({
    id: String(playlist.id ?? `playlist-${index}`),
    name: playlist.name || 'Untitled playlist',
    description: playlist.description || 'Curated for your TesoTunes library.',
    artworkUrl: playlist.artwork_url ?? null,
    ownerName: playlist.owner?.name || 'TesoTunes',
    songCount: playlist.song_count ?? playlist.songs_count ?? 0,
    followerCount: playlist.follower_count ?? 0,
    isPublic: (playlist.visibility ?? 'public') === 'public',
    canEdit: playlist.can_edit ?? false,
    tracks: playlist.songs ? mapSongs({ data: playlist.songs }) : [],
    palette: pickPalette(index + 1),
  }));
}
