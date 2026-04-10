export type ApiListResponse<T> =
  | {
      data?: T[];
      meta?: Record<string, unknown>;
    }
  | T[];

export type MobileSong = {
  id?: number | string;
  slug?: string;
  title?: string;
  name?: string;
  duration?: string | number | null;
  play_count?: number | null;
  stream_count?: number | null;
  artist_name?: string | null;
  artist?: {
    id?: number | string;
    name?: string | null;
  } | null;
  album_id?: number | string | null;
  artwork?: string | null;
  artwork_url?: string | null;
  audio_url?: string | null;
  duration_formatted?: string | null;
};

export type QueueSong = {
  id?: number | string;
  title?: string;
  duration_formatted?: string | null;
  duration_seconds?: number | null;
  play_count?: number | null;
  artwork?: string | null;
  artwork_url?: string | null;
  audio_url?: string | null;
  artist?: {
    id?: number | string;
    name?: string | null;
  } | null;
  album?: {
    id?: number | string;
    title?: string | null;
  } | null;
};

export type QueueItem = {
  id?: number | string;
  position?: number;
  is_current?: boolean;
  song?: QueueSong | null;
};

export type MobileArtist = {
  id?: number | string;
  name?: string;
  followers_count?: number | null;
  monthly_listeners?: number | null;
  bio?: string | null;
};

export type MobileAlbum = {
  id?: number | string;
  title?: string;
  name?: string;
  artist_name?: string | null;
  artist?: {
    id?: number | string;
    name?: string | null;
  } | null;
  release_year?: string | number | null;
  year?: string | number | null;
  description?: string | null;
};

export type PublicEvent = {
  id?: number | string;
  title?: string;
  venue_name?: string | null;
  city?: string | null;
  start_date?: string | null;
  starts_at?: string | null;
};

export type ApiPlaylist = {
  id?: number | string;
  uuid?: string | null;
  name?: string | null;
  description?: string | null;
  artwork_url?: string | null;
  visibility?: string | null;
  song_count?: number | null;
  songs_count?: number | null;
  follower_count?: number | null;
  can_edit?: boolean | null;
  owner?: {
    id?: number | string;
    name?: string | null;
  } | null;
  songs?: MobileSong[] | null;
};
