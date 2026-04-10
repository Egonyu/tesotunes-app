import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthBootstrap } from '../hooks/use-auth-bootstrap';
import { AudioPlaybackProvider } from './audio-playback-provider';
import { DownloadsProvider } from './downloads-provider';
import { PlayHistorySyncProvider } from './play-history-sync-provider';
import { PlayerSyncProvider } from './player-sync-provider';
import { UserActionSyncProvider } from './user-action-sync-provider';

export function AppProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  useAuthBootstrap();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <DownloadsProvider>
          <UserActionSyncProvider>
            <PlayHistorySyncProvider>
              <AudioPlaybackProvider>
                <PlayerSyncProvider>{children}</PlayerSyncProvider>
              </AudioPlaybackProvider>
            </PlayHistorySyncProvider>
          </UserActionSyncProvider>
        </DownloadsProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
