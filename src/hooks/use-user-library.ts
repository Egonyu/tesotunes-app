import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapArtists, mapSongs } from '../services/api/mappers';
import { useAuthStore } from '../store/auth-store';
import { ApiListResponse, MobileArtist, MobileSong } from '../types/api';

type LibraryResponse = {
  data?: {
    liked_songs?: ApiListResponse<MobileSong>;
    recent_plays?: ApiListResponse<MobileSong>;
    downloads?: ApiListResponse<MobileSong>;
    followed_artists?: ApiListResponse<MobileArtist>;
    counts?: {
      liked_songs?: number;
      playlists?: number;
      downloads?: number;
      followed_artists?: number;
    };
  };
};

export function useUserLibrary() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');

  return useQuery({
    queryKey: ['user-library'],
    queryFn: async () => {
      const response = await apiGet<LibraryResponse>('/user/library', token ?? undefined);
      const data = response.data ?? {};

      return {
        likedSongs: mapSongs(data.liked_songs),
        recentPlays: mapSongs(data.recent_plays),
        downloads: mapSongs(data.downloads),
        followedArtists: mapArtists(data.followed_artists),
        counts: data.counts,
      };
    },
    enabled: isAuthenticated && !!token,
    staleTime: 60 * 1000,
  });
}
