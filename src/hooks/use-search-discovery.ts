import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapAlbums, mapArtists, mapCharts, mapGenres, mapPlaylists, mapSongs } from '../services/api/mappers';
import { ApiListResponse, ApiPlaylist, MobileAlbum, MobileArtist, MobileChart, MobileGenre, MobileSong } from '../types/api';

export function useSearchBrowse() {
  return useQuery({
    queryKey: ['search-browse'],
    queryFn: async () => {
      const [genresResponse, chartsResponse] = await Promise.all([
        apiGet<ApiListResponse<MobileGenre>>('/genres'),
        apiGet<ApiListResponse<MobileChart>>('/mobile/featured/charts'),
      ]);

      return {
        genres: mapGenres(genresResponse),
        charts: mapCharts(chartsResponse),
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useSearchResults(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ['search-results', normalizedQuery],
    queryFn: async () => {
      const [songsResponse, artistsResponse, albumsResponse, playlistsResponse] = await Promise.allSettled([
        apiGet<ApiListResponse<MobileSong>>(`/songs?search=${encodeURIComponent(normalizedQuery)}`),
        apiGet<ApiListResponse<MobileArtist>>(`/artists?search=${encodeURIComponent(normalizedQuery)}`),
        apiGet<ApiListResponse<MobileAlbum>>(`/albums?search=${encodeURIComponent(normalizedQuery)}`),
        apiGet<ApiListResponse<ApiPlaylist>>(`/playlists?search=${encodeURIComponent(normalizedQuery)}`),
      ]);

      return {
        songs: songsResponse.status === 'fulfilled' ? mapSongs(songsResponse.value) : [],
        artists: artistsResponse.status === 'fulfilled' ? mapArtists(artistsResponse.value) : [],
        albums: albumsResponse.status === 'fulfilled' ? mapAlbums(albumsResponse.value) : [],
        playlists: playlistsResponse.status === 'fulfilled' ? mapPlaylists(playlistsResponse.value) : [],
      };
    },
    enabled: normalizedQuery.length >= 2,
    staleTime: 30 * 1000,
  });
}
