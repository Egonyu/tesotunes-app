import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapAlbums, mapArtists, mapGenres, mapSongs } from '../services/api/mappers';
import { Album, Artist, Genre, Track } from '../types/music';
import { ApiListResponse, MobileAlbum, MobileArtist, MobileGenre, MobileSong } from '../types/api';

type GenreResourceResponse = MobileGenre | { data?: MobileGenre };

function deriveArtistsFromSongs(songs: Track[]): Artist[] {
  const seen = new Set<string>();

  return songs
    .filter((track) => track.artistId || track.artist)
    .map((track, index) => ({
      id: track.artistId ?? `derived-artist-${index}-${track.artist}`,
      sourceId: track.artistId ? Number(track.artistId) || undefined : undefined,
      name: track.artist,
      monthlyListeners: track.plays,
      palette: track.palette,
      artworkUrl: track.artworkUrl ?? null,
    }))
    .filter((artist) => {
      if (seen.has(artist.id)) {
        return false;
      }

      seen.add(artist.id);
      return true;
    })
    .slice(0, 8);
}

function deriveAlbumsFromSongs(songs: Track[], genre: Genre | null): Album[] {
  const seen = new Set<string>();

  return songs
    .filter((track) => track.albumTitle)
    .map((track, index) => ({
      id: track.albumId ?? `derived-album-${index}-${track.albumTitle}`,
      sourceId: track.albumId ? Number(track.albumId) || undefined : undefined,
      title: track.albumTitle ?? 'Untitled release',
      artist: track.artist,
      year: 'Now',
      palette: track.palette,
      description: genre ? `Live releases currently surfaced in ${genre.name}.` : 'Live releases currently surfaced in this genre.',
      tracks: songs.filter((item) => item.albumId && item.albumId === track.albumId),
      artworkUrl: track.artworkUrl ?? null,
      artistId: track.artistId,
      genre: genre?.name,
      trackCount: songs.filter((item) => item.albumId && item.albumId === track.albumId).length,
      playCountLabel: track.plays,
    }))
    .filter((album) => {
      if (seen.has(album.id)) {
        return false;
      }

      seen.add(album.id);
      return true;
    })
    .slice(0, 8);
}

export function useGenreDetail(id?: string) {
  return useQuery({
    queryKey: ['genre-detail', id],
    queryFn: async (): Promise<{ genre: Genre | null; songs: Track[]; artists: Artist[]; albums: Album[] }> => {
      const [genreResponse, songsResponse, artistsResponse, albumsResponse] = await Promise.all([
        apiGet<GenreResourceResponse>(`/genres/${id}`),
        apiGet<ApiListResponse<MobileSong>>(`/genres/${id}/songs`),
        apiGet<ApiListResponse<MobileArtist>>(`/genres/${id}/artists`),
        apiGet<ApiListResponse<MobileAlbum>>(`/genres/${id}/albums`),
      ]);

      const genre = mapGenres({ data: [((genreResponse as { data?: MobileGenre }).data ?? (genreResponse as MobileGenre))] })[0] ?? null;
      const songs = mapSongs(songsResponse);
      const artists = mapArtists(artistsResponse);
      const albums = mapAlbums(albumsResponse);

      return {
        genre,
        songs,
        artists: artists.length > 0 ? artists : deriveArtistsFromSongs(songs),
        albums: albums.length > 0 ? albums : deriveAlbumsFromSongs(songs, genre),
      };
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}
