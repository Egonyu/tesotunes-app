import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sendTip } from '../services/api/payments';
import { useAuthStore } from '../store/auth-store';

export function useTipArtist() {
  const token = useAuthStore((state) => state.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { recipient_id: number | string; recipient_type: 'artist' | 'song'; amount: number }) =>
      sendTip(token!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-balance'] });
    },
  });
}
