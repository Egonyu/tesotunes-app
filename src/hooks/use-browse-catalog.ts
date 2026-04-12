import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../services/api/client';
import { mapAlbums, mapArtists } from '../services/api/mappers';
import { ApiListResponse, MobileAlbum, MobileArtist } from '../types/api';

async function fetchBrowseArtists() {
  try {
    return await apiGet<ApiListResponse<MobileArtist>>('/mobile/popular/artists?limit=24');
  } catch {
    return apiGet<ApiListResponse<MobileArtist>>('/artists?per_page=24');
  }
}

async function fetchBrowseAlbums() {
  try {
    return await apiGet<ApiListResponse<MobileAlbum>>('/mobile/popular/albums?limit=24');
  } catch {
    return apiGet<ApiListResponse<MobileAlbum>>('/albums?per_page=24');
  }
}

export function useBrowseArtists() {
  return useQuery({
    queryKey: ['browse-artists'],
    queryFn: async () => {
      const response = await fetchBrowseArtists();
      return mapArtists(response);
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useBrowseAlbums() {
  return useQuery({
    queryKey: ['browse-albums'],
    queryFn: async () => {
      const response = await fetchBrowseAlbums();
      return mapAlbums(response);
    },
    staleTime: 2 * 60 * 1000,
  });
}
