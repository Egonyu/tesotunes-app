import { useQueryClient } from '@tanstack/react-query';
import { PropsWithChildren, useEffect } from 'react';

import { flushQueuedUserActions } from '../services/sync/user-action-queue';
import { useAuthStore } from '../store/auth-store';

export function UserActionSyncProvider({ children }: PropsWithChildren) {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const queryClient = useQueryClient();

  useEffect(() => {
    const authToken = token;

    if (!isAuthenticated || typeof authToken !== 'string') {
      return;
    }

    let cancelled = false;

    async function flush() {
      try {
        const result = await flushQueuedUserActions(authToken as string);

        if (!cancelled && result.flushed > 0) {
          queryClient.invalidateQueries({ queryKey: ['user-library'] });
        }
      } catch {
        // The queue stays on device and will be retried on the next cycle.
      }
    }

    void flush();
    const interval = setInterval(() => {
      void flush();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, queryClient, token]);

  return children;
}
