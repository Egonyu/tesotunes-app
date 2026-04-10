import { PropsWithChildren } from 'react';

import { useDownloadBootstrap } from '../hooks/use-downloads';

export function DownloadsProvider({ children }: PropsWithChildren) {
  useDownloadBootstrap();

  return children;
}
