import { useQuery } from '@tanstack/react-query';

import { albums as fallbackAlbums, artists as fallbackArtists, featuredTracks } from '../data/mock-content';
import { apiGet } from '../services/api/client';
import { mapAlbums, mapArtists, mapSongs } from '../services/api/mappers';
import { ApiListResponse, MobileAlbum, MobileArtist, MobileSong } from '../types/api';

export function useMobileHome() {
  return useQuery({
    queryKey: ['mobile-home'],
    queryFn: async () => {
      const [songsRes, artistsRes, albumsRes] = await Promise.allSettled([
        apiGet<ApiListResponse<MobileSong>>('/mobile/trending/songs'),
        apiGet<ApiListResponse<MobileArtist>>('/mobile/popular/artists'),
        apiGet<ApiListResponse<MobileAlbum>>('/mobile/popular/albums'),
      ]);

      return {
        tracks: songsRes.status === 'fulfilled' ? mapSongs(songsRes.value) : featuredTracks,
        artists: artistsRes.status === 'fulfilled' ? mapArtists(artistsRes.value) : fallbackArtists,
        albums: albumsRes.status === 'fulfilled' ? mapAlbums(albumsRes.value) : fallbackAlbums,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
