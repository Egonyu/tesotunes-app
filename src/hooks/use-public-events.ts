import { useQuery } from '@tanstack/react-query';

import { events as fallbackEvents } from '../data/mock-content';
import { apiGet } from '../services/api/client';
import { mapEvents } from '../services/api/mappers';
import { ApiListResponse, PublicEvent } from '../types/api';

export function usePublicEvents() {
  return useQuery({
    queryKey: ['public-events'],
    queryFn: async () => {
      try {
        const response = await apiGet<ApiListResponse<PublicEvent>>('/events/upcoming');
        return mapEvents(response);
      } catch {
        return fallbackEvents;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}
