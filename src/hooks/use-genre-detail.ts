import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapAlbums, mapArtists, mapGenres, mapSongs } from '../services/api/mappers';
import { Album, Artist, Genre, Track } from '../types/music';
import { ApiListResponse, MobileAlbum, MobileArtist, MobileGenre, MobileSong } from '../types/api';

type GenreResourceResponse = MobileGenre | { data?: MobileGenre };

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

      return {
        genre: mapGenres({ data: [((genreResponse as { data?: MobileGenre }).data ?? (genreResponse as MobileGenre))] })[0] ?? null,
        songs: mapSongs(songsResponse),
        artists: mapArtists(artistsResponse),
        albums: mapAlbums(albumsResponse),
      };
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}
