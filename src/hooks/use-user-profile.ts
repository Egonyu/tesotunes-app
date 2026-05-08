import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPostFormData, apiPut } from '../services/api/client';
import { useAuthStore } from '../store/auth-store';
import { ApiUserProfile } from '../types/api';

type UserProfileResponse = {
  data?: ApiUserProfile;
} & ApiUserProfile;

export type UserProfile = {
  id: string;
  name: string;
  username?: string;
  email: string;
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string;
  bannerUrl?: string | null;
  country?: string;
  city?: string;
  timezone?: string;
  language?: string;
  role: string;
  isArtist: boolean;
  isActive: boolean;
  isVerified: boolean;
  isPremium: boolean;
  credits?: number;
  artistStageName?: string;
};

export type UpdateUserProfileInput = {
  name: string;
  bio?: string;
  website?: string;
  phone?: string;
};

export type AvatarUploadResult = {
  avatarUrl: string | null;
};

function unwrapProfile(response: UserProfileResponse): ApiUserProfile {
  return response.data ?? response;
}

function mapUserProfile(response: UserProfileResponse): UserProfile {
  const profile = unwrapProfile(response);

  return {
    id: String(profile.id ?? 'me'),
    name: profile.name?.trim() || 'TesoTunes Listener',
    username: profile.username ?? undefined,
    email: profile.email?.trim() || '',
    displayName: profile.display_name?.trim() || undefined,
    avatarUrl: profile.avatar ?? null,
    bio: profile.bio?.trim() || undefined,
    bannerUrl: profile.banner ?? null,
    country: profile.country ?? undefined,
    city: profile.city ?? undefined,
    timezone: profile.timezone ?? undefined,
    language: profile.language ?? undefined,
    role: profile.role ?? 'user',
    isArtist: Boolean(profile.is_artist),
    isActive: Boolean(profile.is_active ?? true),
    isVerified: Boolean(profile.is_verified),
    isPremium: Boolean(profile.is_premium),
    credits: typeof profile.credits === 'number' ? profile.credits : undefined,
    artistStageName: profile.artist?.stage_name ?? undefined,
  };
}

export function useUserProfile() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const updateUser = useAuthStore((state) => state.updateUser);

  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await apiGet<UserProfileResponse>('/user/profile', token ?? undefined);
      const profile = mapUserProfile(response);
      updateUser({ name: profile.name, email: profile.email });
      return profile;
    },
    enabled: isAuthenticated && !!token,
    staleTime: 60 * 1000,
  });
}

export function useUpdateUserProfile() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const updateUser = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateUserProfileInput) => {
      if (!isAuthenticated || !token) {
        throw new Error('Sign in to update your profile.');
      }

      const response = await apiPut<UserProfileResponse, UpdateUserProfileInput>('/user', payload, token);
      return mapUserProfile(response);
    },
    onSuccess: (profile) => {
      updateUser({ name: profile.name, email: profile.email });
      queryClient.setQueryData(['user-profile'], profile);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}

export function useUploadAvatar() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (localUri: string) => {
      if (!token) throw new Error('Sign in to update your avatar.');

      const formData = new FormData();
      formData.append('avatar', {
        uri: localUri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);

      const response = await apiPostFormData<UserProfileResponse>('/user/avatar', formData, token);
      return mapUserProfile(response);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(['user-profile'], profile);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}
