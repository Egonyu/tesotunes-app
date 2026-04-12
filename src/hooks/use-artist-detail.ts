import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapAlbums, mapArtists, mapSongs } from '../services/api/mappers';
import { Album, Artist, Track } from '../types/music';
import { ApiListResponse, MobileAlbum, MobileArtist, MobileSong } from '../types/api';

type ArtistDetailResponse = MobileArtist;
type ArtistResourceResponse = MobileArtist | { data?: MobileArtist };

export function useArtistDetail(id?: string) {
  return useQuery({
    queryKey: ['artist-detail', id],
    queryFn: async (): Promise<{ artist: Artist | null; songs: Track[]; albums: Album[] }> => {
      const [artistResponse, songsResponse, albumsResponse] = await Promise.all([
        apiGet<ArtistResourceResponse>(`/artists/${id}`),
        apiGet<ApiListResponse<MobileSong>>(`/artists/${id}/songs`),
        apiGet<ApiListResponse<MobileAlbum>>(`/artists/${id}/albums`),
      ]);
      const artistResource = (artistResponse as { data?: MobileArtist }).data ?? (artistResponse as MobileArtist);

      return {
        artist: mapArtists({ data: artistResource ? [artistResource] : [] })[0] ?? null,
        songs: mapSongs(songsResponse),
        albums: mapAlbums(albumsResponse),
      };
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}
