import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapAlbums, mapArtists, mapCharts, mapGenres, mapSongs } from '../services/api/mappers';
import { Album, Artist, Chart, Genre, Track } from '../types/music';
import { ApiListResponse, MobileAlbum, MobileArtist, MobileChart, MobileGenre, MobileSong } from '../types/api';

type GenreResourceResponse = MobileGenre | { data?: MobileGenre };

export function useChartDetail(id?: string) {
  return useQuery({
    queryKey: ['chart-detail', id],
    queryFn: async (): Promise<{ chart: Chart | null; genre: Genre | null; songs: Track[]; artists: Artist[]; albums: Album[] }> => {
      const [chartsResponse, genreResponse, songsResponse, artistsResponse, albumsResponse] = await Promise.allSettled([
        apiGet<ApiListResponse<MobileChart>>('/mobile/featured/charts'),
        apiGet<GenreResourceResponse>(`/genres/${id}`),
        apiGet<ApiListResponse<MobileSong>>(`/genres/${id}/songs`),
        apiGet<ApiListResponse<MobileArtist>>(`/genres/${id}/artists`),
        apiGet<ApiListResponse<MobileAlbum>>(`/genres/${id}/albums`),
      ]);

      const genre =
        genreResponse.status === 'fulfilled'
          ? mapGenres({ data: [((genreResponse.value as { data?: MobileGenre }).data ?? (genreResponse.value as MobileGenre))] })[0] ?? null
          : null;
      const charts = chartsResponse.status === 'fulfilled' ? mapCharts(chartsResponse.value) : [];
      const chart =
        charts.find((item) => item.id === id || String(item.sourceId ?? '') === id) ??
        (genre
          ? {
              id: String(genre.id),
              sourceId: genre.sourceId,
              title: `${genre.name} Chart`,
              genre: genre.name,
              description: genre.description || `Top ${genre.name} tracks on TesoTunes right now.`,
              songCount: genre.songCount,
              totalPlays: 'Live now',
              palette: genre.palette,
              slug: genre.slug,
            }
          : null);

      return {
        chart,
        genre,
        songs: songsResponse.status === 'fulfilled' ? mapSongs(songsResponse.value) : [],
        artists: artistsResponse.status === 'fulfilled' ? mapArtists(artistsResponse.value) : [],
        albums: albumsResponse.status === 'fulfilled' ? mapAlbums(albumsResponse.value) : [],
      };
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}
