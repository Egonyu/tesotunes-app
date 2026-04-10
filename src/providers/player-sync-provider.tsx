import { PropsWithChildren } from 'react';

import { usePlayerQueueSync } from '../hooks/use-player-queue';

export function PlayerSyncProvider({ children }: PropsWithChildren) {
  usePlayerQueueSync();

  return children;
}
