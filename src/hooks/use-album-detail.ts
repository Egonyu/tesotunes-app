import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapAlbum, mapSongs } from '../services/api/mappers';
import { Album } from '../types/music';
import { ApiListResponse, MobileAlbum, MobileSong } from '../types/api';

type AlbumResourceResponse = MobileAlbum | { data?: MobileAlbum };

export function useAlbumDetail(id?: string) {
  return useQuery({
    queryKey: ['album-detail', id],
    queryFn: async (): Promise<Album | null> => {
      const albumResponse = await apiGet<AlbumResourceResponse>(`/albums/${id}`);
      const album = mapAlbum(albumResponse);

      if (!album) {
        return null;
      }

      if (album.tracks.length > 0) {
        return album;
      }

      const tracksResponse = await apiGet<ApiListResponse<MobileSong>>(`/albums/${id}/tracks`);

      return {
        ...album,
        tracks: mapSongs(tracksResponse),
      };
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}
