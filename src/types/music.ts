export type ArtworkPalette = [string, string];

export type Artist = {
  id: string;
  sourceId?: number;
  name: string;
  monthlyListeners: string;
  palette: ArtworkPalette;
  bio?: string;
  followerCount?: number;
};

export type Track = {
  id: string;
  sourceId?: number;
  title: string;
  artist: string;
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
  title: string;
  artist: string;
  year: string;
  palette: ArtworkPalette;
  description: string;
  tracks: Track[];
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
