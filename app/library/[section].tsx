import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ArtworkImage } from '../../src/components/artwork-image';
import { TrackRow } from '../../src/components/media';
import { Screen } from '../../src/components/screen';
import { StateMessage } from '../../src/components/state-message';
import { useUserLibrary } from '../../src/hooks/use-user-library';
import { useDownloadStore } from '../../src/store/download-store';
import { colors } from '../../src/theme/colors';

const SECTION_COPY = {
  'liked-songs': {
    title: 'Liked Songs',
    emptyTitle: 'No liked songs yet',
    emptyBody: 'Songs you like will appear here and stay synced with your account.',
  },
  'recently-played': {
    title: 'Recently Played',
    emptyTitle: 'No recent plays yet',
    emptyBody: 'Your recent listening will appear here once you start playing songs.',
  },
  downloaded: {
    title: 'Downloaded',
    emptyTitle: 'No offline songs yet',
    emptyBody: 'Songs you download for offline playback will appear here.',
  },
  following: {
    title: 'Following',
    emptyTitle: 'No followed artists yet',
    emptyBody: 'Artists you follow will appear here for quick access and future releases.',
  },
} as const;

type SectionKey = keyof typeof SECTION_COPY;

function isSectionKey(value: string): value is SectionKey {
  return value in SECTION_COPY;
}

export default function LibrarySectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const { data, isLoading } = useUserLibrary();
  const localDownloads = useDownloadStore((state) => state.downloads);

  if (!section || !isSectionKey(section)) {
    return (
      <Screen>
        <StateMessage title="Library section not found" body="This library section is not available. Return to your library and choose a music collection." />
      </Screen>
    );
  }

  const copy = SECTION_COPY[section];
  const likedTracks = data?.likedSongs ?? [];
  const recentTracks = data?.recentPlays ?? [];
  const followedArtists = data?.followedArtists ?? [];
  const downloadedTracks = localDownloads.filter((item) => item.status === 'completed').map((item) => item.track);
  const trackContent =
    section === 'liked-songs'
      ? likedTracks
      : section === 'recently-played'
        ? recentTracks
        : section === 'downloaded'
          ? downloadedTracks
          : [];
  const artistContent = section === 'following' ? followedArtists : [];

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
          <Text style={styles.backLabel}>Library</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{copy.title}</Text>
      </View>

      {isLoading && section !== 'downloaded' ? <ActivityIndicator color={colors.accent} /> : null}

      {section === 'following' ? (
        <View style={styles.list}>
          {artistContent.length ? (
            artistContent.map((artist) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistRow}
                activeOpacity={0.85}
                onPress={() => router.push(`/artist/${artist.id}`)}
              >
                <ArtworkImage uri={artist.artworkUrl} palette={artist.palette} style={styles.artistArt} />
                <View style={styles.artistMeta}>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  <Text style={styles.artistSubtitle}>{artist.monthlyListeners}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </TouchableOpacity>
            ))
          ) : !isLoading ? (
            <StateMessage title={copy.emptyTitle} body={copy.emptyBody} />
          ) : null}
        </View>
      ) : (
        <View style={styles.list}>
          {trackContent.length ? (
            trackContent.map((track) => <TrackRow key={`${section}-${track.id}`} track={track} queue={trackContent} />)
          ) : !isLoading || section === 'downloaded' ? (
            <StateMessage title={copy.emptyTitle} body={copy.emptyBody} />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  list: {
    gap: 14,
  },
  artistRow: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  artistArt: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  artistMeta: {
    flex: 1,
    gap: 4,
  },
  artistName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  artistSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
