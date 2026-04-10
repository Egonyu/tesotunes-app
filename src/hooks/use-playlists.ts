import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPost, apiPut } from '../services/api/client';
import { mapPlaylists } from '../services/api/mappers';
import { useAuthStore } from '../store/auth-store';
import { ApiListResponse, ApiPlaylist } from '../types/api';

type PlaylistDetailResponse = {
  data?: ApiPlaylist;
};

export function useMyPlaylists() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');

  return useQuery({
    queryKey: ['my-playlists'],
    queryFn: async () => {
      const response = await apiGet<ApiListResponse<ApiPlaylist>>('/my/playlists', token ?? undefined);
      return mapPlaylists(response);
    },
    enabled: isAuthenticated && !!token,
    staleTime: 60 * 1000,
  });
}

export function usePlaylistDetail(id?: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['playlist-detail', id],
    queryFn: async () => {
      const response = await apiGet<PlaylistDetailResponse>(`/playlists/${id}`, token ?? undefined);
      return mapPlaylists({ data: response.data ? [response.data] : [] })[0] ?? null;
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreatePlaylist() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; isPublic: boolean }) => {
      if (!isAuthenticated || !token) {
        throw new Error('Sign in to create playlists.');
      }

      return apiPost<PlaylistDetailResponse, { title: string; description?: string; is_public: boolean }>(
        '/playlists',
        {
          title: payload.name,
          description: payload.description,
          is_public: payload.isPublic,
        },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['user-library'] });
    },
  });
}

export function useAddTrackToPlaylist() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { playlistId: string; trackId: number }) => {
      if (!isAuthenticated || !token) {
        throw new Error('Sign in to add songs to playlists.');
      }

      return apiPost(`/playlists/${payload.playlistId}/tracks`, { track_id: payload.trackId }, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-detail', variables.playlistId] });
    },
  });
}

export function useUpdatePlaylist(id?: string) {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; isPublic: boolean }) => {
      if (!isAuthenticated || !token || !id) {
        throw new Error('Sign in to edit playlists.');
      }

      return apiPut<PlaylistDetailResponse, { title: string; description?: string; is_public: boolean }>(
        `/playlists/${id}`,
        {
          title: payload.name,
          description: payload.description,
          is_public: payload.isPublic,
        },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['user-library'] });
    },
  });
}

export function useDeletePlaylist() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlistId: string) => {
      if (!isAuthenticated || !token) {
        throw new Error('Sign in to delete playlists.');
      }

      return apiDelete<{ message?: string }>(`/playlists/${playlistId}`, token);
    },
    onSuccess: (_, playlistId) => {
      queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-detail', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['user-library'] });
    },
  });
}

export function useRemoveTrackFromPlaylist(playlistId?: string) {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: number) => {
      if (!isAuthenticated || !token || !playlistId) {
        throw new Error('Sign in to edit playlists.');
      }

      return apiDelete<{ message?: string }>(`/playlists/${playlistId}/songs/${trackId}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-detail', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['user-library'] });
    },
  });
}

export function useReorderPlaylistTracks(playlistId?: string) {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songIds: number[]) => {
      if (!isAuthenticated || !token || !playlistId) {
        throw new Error('Sign in to edit playlists.');
      }

      return apiPost<{ message?: string }, { song_ids: number[] }>(
        `/playlists/${playlistId}/reorder`,
        { song_ids: songIds },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-detail', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['user-library'] });
    },
  });
}
