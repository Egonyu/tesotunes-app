export type ArtworkPalette = [string, string];

export type Artist = {
  id: string;
  sourceId?: number;
  name: string;
  monthlyListeners: string;
  palette: ArtworkPalette;
  artworkUrl?: string | null;
  bio?: string;
  followerCount?: number;
  songCount?: number;
  albumCount?: number;
  city?: string;
  country?: string;
  genre?: string;
};

export type Track = {
  id: string;
  sourceId?: number;
  queueItemId?: number;
  queuePosition?: number;
  title: string;
  artist: string;
  albumTitle?: string;
  duration: string;
  plays: string;
  palette: ArtworkPalette;
  albumId?: string;
  artistId?: string;
  artworkUrl?: string | null;
  playbackUri?: string | null;
  playbackSource?: 'remote' | 'offline';
};

export type Album = {
  id: string;
  sourceId?: number;
  title: string;
  artist: string;
  year: string;
  palette: ArtworkPalette;
  description: string;
  tracks: Track[];
  artworkUrl?: string | null;
  artistId?: string;
  genre?: string;
  trackCount?: number;
  playCountLabel?: string;
};

export type Genre = {
  id: string;
  sourceId?: number;
  name: string;
  slug?: string;
  description?: string;
  songCount: number;
  palette: ArtworkPalette;
};

export type Chart = {
  id: string;
  sourceId?: number;
  title: string;
  genre: string;
  description: string;
  songCount: number;
  totalPlays: string;
  momentumLabel?: string;
  averagePlaysLabel?: string;
  palette: ArtworkPalette;
  slug?: string;
  artworkUrl?: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  venue: string;
  dateLabel: string;
  city: string;
  palette: ArtworkPalette;
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  artworkUrl?: string | null;
  ownerName?: string | null;
  songCount: number;
  followerCount: number;
  isPublic: boolean;
  canEdit?: boolean;
  tracks?: Track[];
  palette: ArtworkPalette;
};
