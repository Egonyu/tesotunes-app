import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiPost } from '../services/api/client';
import { enqueueUserAction } from '../services/sync/user-action-queue';
import { useAuthStore } from '../store/auth-store';
import { useLibraryStore } from '../store/library-store';
import { Artist } from '../types/music';

type FollowResponse = {
  success?: boolean;
  is_following?: boolean;
  follower_count?: number;
};

export function useFollowedArtistIds() {
  const authStatus = useAuthStore((state) => state.status);
  const followedArtistIds = useLibraryStore((state) => state.followedArtistIds);

  if (authStatus !== 'authenticated') {
    return new Set<string>();
  }

  return followedArtistIds;
}

export function useArtistFollowStatus(artist?: Artist) {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const followedArtistIds = useFollowedArtistIds();
  const initialFollowing = artist ? followedArtistIds.has(`source:${artist.sourceId ?? artist.id}`) : false;

  return useQuery({
    queryKey: ['artist-follow-status', artist?.sourceId],
    queryFn: async () => initialFollowing,
    enabled: isAuthenticated && !!token && typeof artist?.sourceId === 'number',
    initialData: initialFollowing,
    staleTime: 60 * 1000,
  });
}

export function useToggleArtistFollow(artist?: Artist) {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();
  const followStatus = useArtistFollowStatus(artist);

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !token || !artist?.sourceId) {
        throw new Error('Sign in to follow artists.');
      }

      try {
        if (followStatus.data) {
          return await apiDelete<FollowResponse>(`/artists/${artist.sourceId}/follow`, token);
        }

        return await apiPost<FollowResponse>(`/artists/${artist.sourceId}/follow`, {}, token);
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('Network request failed')) {
          throw error;
        }

        const nextFollowing = !followStatus.data;
        await enqueueUserAction({
          type: 'follow',
          artistId: artist.sourceId,
          action: nextFollowing ? 'follow' : 'unfollow',
        });

        return {
          success: true,
          is_following: nextFollowing,
        };
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['artist-follow-status', artist?.sourceId], response.is_following ?? false);
      queryClient.invalidateQueries({ queryKey: ['user-library'] });
      queryClient.invalidateQueries({ queryKey: ['artist-detail', artist?.id] });
    },
  });
}
