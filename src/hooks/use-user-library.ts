import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { apiGet } from '../services/api/client';
import { mapArtists, mapPlaylists, mapSongs } from '../services/api/mappers';
import { loadRecentTracks } from '../services/media/recent-tracks';
import { useLibraryStore } from '../store/library-store';
import { useAuthStore } from '../store/auth-store';
import { ApiListResponse, ApiPlaylist, MobileArtist, MobileSong } from '../types/api';
import { Track } from '../types/music';

type LibraryResponse = {
  data?: {
    liked_songs?: ApiListResponse<MobileSong>;
    playlists?: ApiListResponse<ApiPlaylist>;
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
  const setLikedTrackIds = useLibraryStore((state) => state.setLikedTrackIds);
  const setFollowedArtistIds = useLibraryStore((state) => state.setFollowedArtistIds);

  const query = useQuery({
    queryKey: ['user-library'],
    queryFn: async () => {
      const [response, localRecentTracks] = await Promise.all([
        apiGet<LibraryResponse>('/user/library', token ?? undefined),
        loadRecentTracks(),
      ]);
      const data = response.data ?? {};
      const serverRecentPlays = mapSongs(data.recent_plays);
      const mergedRecentPlays = [...serverRecentPlays, ...localRecentTracks].reduce<Track[]>((acc, track) => {
        if (!acc.some((item) => item.id === track.id)) {
          acc.push(track);
        }

        return acc;
      }, []);

      return {
        likedSongs: mapSongs(data.liked_songs),
        playlists: mapPlaylists(data.playlists),
        recentPlays: mergedRecentPlays,
        downloads: mapSongs(data.downloads),
        followedArtists: mapArtists(data.followed_artists),
        counts: data.counts,
      };
    },
    enabled: isAuthenticated && !!token,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!query.data) {
      if (!isAuthenticated) {
        setLikedTrackIds(new Set<string>());
        setFollowedArtistIds(new Set<string>());
      }
      return;
    }

    setLikedTrackIds(new Set(query.data.likedSongs.map((track) => `source:${track.sourceId ?? track.id}`)));
    setFollowedArtistIds(new Set(query.data.followedArtists.map((artist) => `source:${artist.sourceId ?? artist.id}`)));
  }, [isAuthenticated, query.data, setFollowedArtistIds, setLikedTrackIds]);

  return query;
}
