import { useMutation, useQueryClient } from '@tanstack/react-query';

import { purchaseSong } from '../services/api/payments';
import { useAuthStore } from '../store/auth-store';

export function useSongPurchase() {
  const token = useAuthStore((state) => state.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ songId, paymentMethod }: { songId: number | string; paymentMethod: 'wallet' | 'credits' }) =>
      purchaseSong(token!, songId, paymentMethod),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['credit-balance'] });
    },
  });
}
