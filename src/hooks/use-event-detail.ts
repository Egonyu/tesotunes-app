import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '../services/api/client';
import { mapEvents } from '../services/api/mappers';
import { useAuthStore } from '../store/auth-store';
import { PublicEvent } from '../types/api';
import { EventItem } from '../types/music';

type SingleEventResponse = {
  data?: PublicEvent;
} & PublicEvent;

function mapSingleEvent(response: SingleEventResponse, id: string): EventItem {
  const raw = response.data ?? response;
  const [mapped] = mapEvents({ data: [raw] });
  return mapped ?? { id, title: 'Event', venue: 'TBA', dateLabel: '', city: '', palette: ['#1a1a2e', '#16213e'] };
}

export function useEventDetail(id: string, fallback?: EventItem) {
  return useQuery({
    queryKey: ['event-detail', id],
    queryFn: async () => {
      try {
        const response = await apiGet<SingleEventResponse>(`/events/${id}`);
        return mapSingleEvent(response, id);
      } catch {
        return fallback ?? null;
      }
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    placeholderData: fallback,
  });
}

export function useEventWaitlist(eventId: string) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Sign in to register your interest.');
      await apiPost(`/events/${eventId}/waitlist`, {}, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-detail', eventId] });
    },
  });
}
