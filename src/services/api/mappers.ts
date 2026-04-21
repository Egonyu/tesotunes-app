import { albums as fallbackAlbums, artists as fallbackArtists, events as fallbackEvents, featuredTracks, playlists as fallbackPlaylists } from '../../data/mock-content';
import { Album, Artist, Chart, EventItem, Genre, Playlist, Track } from '../../types/music';
import { ApiListResponse, ApiPlaylist, MobileAlbum, MobileArtist, MobileChart, MobileGenre, MobileSong, PublicEvent, QueueItem, QueueSong } from '../../types/api';

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

function unwrapResource<T>(resource: T | { data?: T } | undefined | null): T | null {
  if (!resource) return null;
  if (typeof resource === 'object' && resource !== null && 'data' in resource) {
    return (resource as { data?: T }).data ?? null;
  }

  return resource as T;
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

function formatCompactCount(value?: number | null) {
  if (!value) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
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

function getArtistName(artist?: MobileSong['artist'] | QueueSong['artist'], artistName?: string | null) {
  if (artistName) return artistName;
  if (typeof artist === 'string' && artist.trim().length > 0) return artist;
  if (artist && typeof artist === 'object' && artist.name) return artist.name;
  return 'Unknown artist';
}

function getArtistId(artist?: MobileSong['artist'] | QueueSong['artist'], artistId?: number | string | null) {
  if (typeof artistId === 'number') return String(artistId);
  if (typeof artistId === 'string' && artistId.trim().length > 0) return artistId;
  if (artist && typeof artist === 'object' && artist.id !== undefined && artist.id !== null) {
    return String(artist.id);
  }

  return undefined;
}

export function mapSongs(response?: ApiListResponse<MobileSong>, options?: { fallback?: boolean }): Track[] {
  const items = listFromResponse(response);
  if (items.length === 0) return options?.fallback ? featuredTracks : [];

  return items.map((song, index) => ({
    id: String(song.id ?? song.slug ?? `track-${index}`),
    sourceId: typeof song.id === 'number' ? song.id : Number(song.id) || undefined,
    title: song.title || song.name || 'Untitled track',
    artist: getArtistName(song.artist, song.artist_name),
    albumTitle: song.album?.title ?? undefined,
    duration: song.duration_formatted || (typeof song.duration === 'string' ? song.duration : '3:20'),
    plays: formatPlays(song.play_count ?? song.stream_count),
    palette: pickPalette(index),
    albumId: song.album?.id ? String(song.album.id) : (song.album_id ? String(song.album_id) : undefined),
    artistId: getArtistId(song.artist, song.artist_id),
    artworkUrl: song.artwork_url ?? song.artwork ?? null,
    playbackUri: song.audio_url ?? song.stream_url ?? null,
    playbackSource: 'remote',
  }));
}

export function mapQueueSong(song: QueueSong, index: number, options?: { queueItemId?: number; queuePosition?: number }): Track {
  return {
    id: String(song.id ?? `queue-track-${index}`),
    sourceId: typeof song.id === 'number' ? song.id : Number(song.id) || undefined,
    queueItemId: options?.queueItemId,
    queuePosition: options?.queuePosition,
    title: song.title || 'Untitled track',
    artist: getArtistName(song.artist, song.artist_name),
    albumTitle: song.album?.title ?? undefined,
    duration: song.duration_formatted || '3:20',
    plays: formatPlays(song.play_count),
    palette: pickPalette(index),
    albumId: song.album?.id ? String(song.album.id) : undefined,
    artistId: getArtistId(song.artist, song.artist_id),
    artworkUrl: song.artwork_url ?? song.artwork ?? null,
    playbackUri: song.audio_url ?? null,
    playbackSource: song.audio_url ? 'remote' : 'remote',
  };
}

export function mapQueue(items?: QueueItem[]) {
  const queueItems = items ?? [];
  const queue = queueItems
    .filter((item): item is QueueItem & { song: QueueSong } => Boolean(item.song))
    .map((item, index) =>
      mapQueueSong(item.song!, index, {
        queueItemId: typeof item.id === 'number' ? item.id : Number(item.id) || undefined,
        queuePosition: item.position,
      })
    );

  const currentItem = queueItems.find((item) => item.is_current && item.song);
  const currentTrack = currentItem?.song
    ? mapQueueSong(currentItem.song, 0, {
        queueItemId: typeof currentItem.id === 'number' ? currentItem.id : Number(currentItem.id) || undefined,
        queuePosition: currentItem.position,
      })
    : queue[0] ?? null;

  return { queue, currentTrack };
}

export function mapArtists(response?: ApiListResponse<MobileArtist>, options?: { fallback?: boolean }): Artist[] {
  const items = listFromResponse(response);
  if (items.length === 0) return options?.fallback ? fallbackArtists : [];

  return items.map((artist, index) => ({
    id: String(artist.id ?? `artist-${index}`),
    sourceId: typeof artist.id === 'number' ? artist.id : Number(artist.id) || undefined,
    name: artist.name || 'Unknown artist',
    monthlyListeners: formatListeners(artist.monthly_listeners ?? artist.followers_count ?? artist.follower_count),
    palette: pickPalette(index),
    artworkUrl: artist.avatar_url ?? artist.avatar ?? null,
    bio: artist.bio || undefined,
    followerCount: artist.followers_count ?? artist.follower_count ?? undefined,
    songCount: artist.total_songs ?? undefined,
    albumCount: artist.total_albums ?? undefined,
    city: artist.city ?? undefined,
    country: artist.country ?? undefined,
    genre: artist.genre?.name ?? undefined,
  }));
}

export function mapAlbum(resource?: MobileAlbum | { data?: MobileAlbum } | null): Album | null {
  const album = unwrapResource(resource);
  if (!album) return null;

  const tracks = album.songs ? mapSongs({ data: album.songs }) : [];

  return {
    id: String(album.id ?? album.slug ?? 'album'),
    sourceId: typeof album.id === 'number' ? album.id : Number(album.id) || undefined,
    title: album.title || album.name || 'Untitled album',
    artist: album.artist_name || album.artist?.name || 'Unknown artist',
    year: String(album.release_year ?? album.year ?? (album.release_date ? new Date(album.release_date).getFullYear() : '2026')),
    palette: pickPalette(typeof album.id === 'number' ? album.id : 0),
    description: album.description || 'Featured release on TesoTunes.',
    tracks,
    artworkUrl: album.artwork_url ?? album.artwork ?? null,
    artistId: album.artist?.id ? String(album.artist.id) : undefined,
    genre: album.genre?.name ?? undefined,
    trackCount: album.total_tracks ?? tracks.length ?? undefined,
    playCountLabel: formatPlays(album.play_count),
  };
}

export function mapAlbums(response?: ApiListResponse<MobileAlbum>, options?: { fallback?: boolean }): Album[] {
  const items = listFromResponse(response);
  if (items.length === 0) return options?.fallback ? fallbackAlbums : [];

  return items
    .map((album, index) => {
      const mapped = mapAlbum(album);
      return mapped ? { ...mapped, palette: pickPalette(index) } : null;
    })
    .filter((album): album is Album => Boolean(album));
}

export function mapGenres(response?: ApiListResponse<MobileGenre>): Genre[] {
  const items = listFromResponse(response);

  return items.map((genre, index) => ({
    id: String(genre.id ?? genre.slug ?? `genre-${index}`),
    sourceId: typeof genre.id === 'number' ? genre.id : Number(genre.id) || undefined,
    name: genre.name || 'Untitled genre',
    slug: genre.slug ?? undefined,
    description: genre.description ?? undefined,
    songCount: genre.song_count ?? 0,
    palette: [genre.color ?? pickPalette(index)[0], pickPalette(index)[1]],
  }));
}

export function mapCharts(response?: ApiListResponse<MobileChart>): Chart[] {
  const items = listFromResponse(response);

  return items.map((chart, index) => {
    const totalPlays = chart.total_plays ?? 0;
    const songCount = chart.songs_count ?? 0;
    const averagePlays = songCount > 0 ? Math.round(totalPlays / songCount) : 0;

    return {
      id: String(chart.id ?? chart.slug ?? `chart-${index}`),
      sourceId: typeof chart.id === 'number' ? chart.id : Number(chart.id) || undefined,
      title: chart.title || `${chart.genre || 'Featured'} Chart`,
      genre: chart.genre || 'Featured',
      description: chart.description || 'Top tracks people are replaying right now.',
      songCount,
      totalPlays: `${formatCompactCount(totalPlays)} plays`,
      momentumLabel:
        totalPlays >= 100000
          ? 'Heavy rotation'
          : totalPlays >= 10000
            ? 'Growing fast'
            : songCount > 0
              ? 'Emerging lane'
              : 'Warming up',
      averagePlaysLabel: songCount > 0 ? `${formatCompactCount(averagePlays)} avg / track` : undefined,
      palette: pickPalette(index + 3),
      slug: chart.slug ?? undefined,
      artworkUrl: chart.artwork ?? null,
    };
  });
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

export function mapPlaylists(response?: ApiListResponse<ApiPlaylist>, options?: { fallback?: boolean }): Playlist[] {
  const items = listFromResponse(response);
  if (items.length === 0) return options?.fallback ? fallbackPlaylists : [];

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
