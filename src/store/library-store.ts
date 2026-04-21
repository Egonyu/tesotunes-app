import { create } from 'zustand';

type LibraryState = {
  likedTrackIds: Set<string>;
  followedArtistIds: Set<string>;
  setLikedTrackIds: (ids: Set<string>) => void;
  setFollowedArtistIds: (ids: Set<string>) => void;
  reset: () => void;
};

export const useLibraryStore = create<LibraryState>((set) => ({
  likedTrackIds: new Set<string>(),
  followedArtistIds: new Set<string>(),
  setLikedTrackIds: (ids) => set({ likedTrackIds: ids }),
  setFollowedArtistIds: (ids) => set({ followedArtistIds: ids }),
  reset: () => set({ likedTrackIds: new Set<string>(), followedArtistIds: new Set<string>() }),
}));
