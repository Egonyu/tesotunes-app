import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapArtists, mapSongs } from '../services/api/mappers';
import { Artist, Track } from '../types/music';
import { ApiListResponse, MobileArtist, MobileSong } from '../types/api';

type ArtistDetailResponse = MobileArtist;

export function useArtistDetail(id?: string) {
  return useQuery({
    queryKey: ['artist-detail', id],
    queryFn: async (): Promise<{ artist: Artist | null; songs: Track[] }> => {
      const [artistResponse, songsResponse] = await Promise.all([
        apiGet<ArtistDetailResponse>(`/artists/${id}`),
        apiGet<ApiListResponse<MobileSong>>(`/artists/${id}/songs`),
      ]);

      return {
        artist: mapArtists({ data: [artistResponse] })[0] ?? null,
        songs: mapSongs(songsResponse),
      };
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}
