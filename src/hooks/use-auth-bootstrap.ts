import { useEffect } from 'react';

import { bootstrapSession, registerAuthInterceptor } from '../services/auth/session';
import { useAuthStore } from '../store/auth-store';

export function useAuthBootstrap() {
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    registerAuthInterceptor();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      void bootstrapSession();
    }
  }, [hydrated]);
}
