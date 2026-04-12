import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapAlbums, mapArtists, mapCharts, mapSongs } from '../services/api/mappers';
import { ApiListResponse, MobileAlbum, MobileArtist, MobileChart, MobileSong } from '../types/api';

async function fetchArtistsForHome() {
  try {
    return await apiGet<ApiListResponse<MobileArtist>>('/mobile/popular/artists');
  } catch {
    return apiGet<ApiListResponse<MobileArtist>>('/artists');
  }
}

async function fetchAlbumsForHome() {
  try {
    return await apiGet<ApiListResponse<MobileAlbum>>('/mobile/popular/albums');
  } catch {
    return apiGet<ApiListResponse<MobileAlbum>>('/albums');
  }
}

export function useMobileHome() {
  return useQuery({
    queryKey: ['mobile-home'],
    queryFn: async () => {
      const [songsRes, artistsRes, albumsRes, chartsRes] = await Promise.allSettled([
        apiGet<ApiListResponse<MobileSong>>('/mobile/trending/songs'),
        fetchArtistsForHome(),
        fetchAlbumsForHome(),
        apiGet<ApiListResponse<MobileChart>>('/mobile/featured/charts'),
      ]);

      return {
        tracks: songsRes.status === 'fulfilled' ? mapSongs(songsRes.value) : [],
        artists: artistsRes.status === 'fulfilled' ? mapArtists(artistsRes.value) : [],
        albums: albumsRes.status === 'fulfilled' ? mapAlbums(albumsRes.value) : [],
        charts: chartsRes.status === 'fulfilled' ? mapCharts(chartsRes.value) : [],
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
