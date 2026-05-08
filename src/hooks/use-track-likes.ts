import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '../services/api/client';
import { enqueueUserAction } from '../services/sync/user-action-queue';
import { useAuthStore } from '../store/auth-store';
import { useLibraryStore } from '../store/library-store';
import { Track } from '../types/music';

type LikeStatusResponse = {
  success?: boolean;
  isLiked?: boolean;
};

type LikeToggleResponse = {
  success?: boolean;
  is_liked?: boolean;
  like_count?: number;
};

export function useLikedTrackIds() {
  const authStatus = useAuthStore((state) => state.status);
  const likedTrackIds = useLibraryStore((state) => state.likedTrackIds);

  if (authStatus !== 'authenticated') {
    return new Set<string>();
  }

  return likedTrackIds;
}

export function useTrackLikeStatus(track?: Track) {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const likedTrackIds = useLikedTrackIds();
  const initialLiked = track ? likedTrackIds.has(`source:${track.sourceId ?? track.id}`) : false;

  return useQuery({
    queryKey: ['track-like-status', track?.sourceId],
    queryFn: async () => initialLiked,
    enabled: isAuthenticated && typeof track?.sourceId === 'number',
    initialData: initialLiked,
    staleTime: Infinity,
  });
}

export function useToggleTrackLike(track?: Track) {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();
  const likeStatus = useTrackLikeStatus(track);

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !token || !track?.sourceId) {
        throw new Error('Sign in to like songs.');
      }

      try {
        return await apiPost<LikeToggleResponse>(`/tracks/${track.sourceId}/like`, {}, token);
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('Network request failed')) {
          throw error;
        }

        const nextLiked = !likeStatus.data;
        await enqueueUserAction({
          type: 'like',
          songId: track.sourceId,
          action: nextLiked ? 'like' : 'unlike',
        });

        return {
          success: true,
          is_liked: nextLiked,
        };
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['track-like-status', track?.sourceId], response.is_liked ?? false);
      queryClient.invalidateQueries({ queryKey: ['user-library'] });
    },
  });
}
