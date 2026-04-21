import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../src/components/app-header';
import { Screen } from '../../src/components/screen';
import { StateMessage } from '../../src/components/state-message';
import { ArtistCard, TrackRow } from '../../src/components/media';
import { useMyPlaylists } from '../../src/hooks/use-playlists';
import { useUserLibrary } from '../../src/hooks/use-user-library';
import { signOut } from '../../src/services/auth/session';
import { useAuthStore } from '../../src/store/auth-store';
import { useDownloadStore } from '../../src/store/download-store';
import { colors } from '../../src/theme/colors';

export default function LibraryScreen() {
  const authStatus = useAuthStore((state) => state.status);
  const { data, isLoading } = useUserLibrary();
  const { data: playlists } = useMyPlaylists();
  const localDownloads = useDownloadStore((state) => state.downloads);
  const isAuthenticated = authStatus === 'authenticated';
  const recentTracks = data?.recentPlays ?? [];
  const likedTracks = data?.likedSongs ?? [];
  const followedArtists = data?.followedArtists ?? [];
  const downloadedTracks = localDownloads.filter((item) => item.status === 'completed').map((item) => item.track);
  const activeDownloads = localDownloads.filter((item) => item.status !== 'completed');
  const downloadCount = localDownloads.length || data?.counts?.downloads || 0;
  const libraryCollections = [
    {
      key: 'liked-songs',
      title: 'Liked Songs',
      subtitle: `${likedTracks.length || data?.counts?.liked_songs || 0} saved tracks`,
      color: '#2a2a7d',
      href: '/library/liked-songs',
    },
    {
      key: 'downloaded',
      title: 'Downloaded',
      subtitle: downloadCount > 0 ? `${downloadCount} songs ready offline` : 'Music for offline listening',
      color: '#22543d',
      href: '/library/downloaded',
    },
    {
      key: 'following',
      title: 'Following',
      subtitle: `${data?.counts?.followed_artists || followedArtists.length || 0} artists followed`,
      color: '#3a3a3a',
      href: '/library/following',
    },
    {
      key: 'recently-played',
      title: 'Recently Played',
      subtitle: recentTracks.length > 0 ? `${recentTracks.length} tracks in recent rotation` : 'Your most recent listening',
      color: '#3a3a3a',
      href: '/library/recently-played',
    },
  ];

  if (!isAuthenticated) {
    return (
      <Screen contentContainerStyle={styles.guestScreen}>
        <View style={styles.guestCard}>
          <Text style={styles.title}>Your Library</Text>
          <Text style={styles.guestCopy}>
            Sign in to sync liked songs, playlists, downloads, and your listening history across devices.
          </Text>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={() => router.push('/sign-in')}>
            <Text style={styles.primaryButtonLabel}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.push('/sign-up')}>
            <Text style={styles.secondaryButtonLabel}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppHeader
          eyebrow="Collection"
          title="Your Library"
          subtitle="Your saved songs, playlists, artists, downloads, and recent listening in one place."
          actions={[
            {
              icon: 'create-outline',
              accessibilityLabel: 'Edit profile',
              onPress: () => router.push('/profile/edit' as never),
            },
            {
              icon: 'log-out-outline',
              accessibilityLabel: 'Sign out',
              onPress: () => void signOut(),
            },
          ]}
        />
      </View>

      <View style={styles.chips}>
        {[
          { label: 'Playlists', action: () => router.push('/playlists') },
          { label: `Downloads ${downloadCount > 0 ? `(${downloadCount})` : ''}`.trim(), action: () => router.push('/library/downloaded') },
          { label: `Artists ${followedArtists.length > 0 ? `(${followedArtists.length})` : ''}`.trim(), action: () => router.push('/library/following') },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.chip} activeOpacity={0.85} onPress={item.action}>
            <Text style={styles.chipLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.collection}>
        {libraryCollections.map((item) => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.85}
            style={styles.collectionRow}
            onPress={() => router.push(item.href as never)}
          >
            <View style={[styles.collectionArt, { backgroundColor: item.color }]} />
            <View style={styles.collectionMeta}>
              <Text style={styles.collectionTitle}>{item.title}</Text>
              <Text style={styles.collectionSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.trackBlock}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Following</Text>
          <TouchableOpacity onPress={() => router.push('/library/following')}>
            <Text style={styles.linkLabel}>{data?.counts?.followed_artists ?? followedArtists.length} artists</Text>
          </TouchableOpacity>
        </View>
        {followedArtists.length === 0 ? (
          <Text style={styles.emptyText}>Artists you follow will appear here for quick access.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistRow}>
            {followedArtists.map((artist) => (
              <ArtistCard key={`followed-${artist.id}`} artist={artist} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.trackBlock}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Your playlists</Text>
          <TouchableOpacity onPress={() => router.push('/playlists')}>
            <Text style={styles.linkLabel}>View all</Text>
          </TouchableOpacity>
        </View>
        {playlists?.slice(0, 3).map((playlist) => (
          <TouchableOpacity key={playlist.id} style={styles.collectionRow} onPress={() => router.push(`/playlists/${playlist.id}`)}>
            <View style={[styles.collectionArt, { backgroundColor: playlist.palette[0] }]} />
            <View style={styles.collectionMeta}>
              <Text style={styles.collectionTitle}>{playlist.name}</Text>
              <Text style={styles.collectionSubtitle}>
                {playlist.songCount} songs • {playlist.isPublic ? 'Public' : 'Private'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {!playlists?.length ? (
          <StateMessage compact title="No playlists yet" body="Create playlists to organize your music, mixes, and offline listening flow." />
        ) : null}
      </View>

      <View style={styles.trackBlock}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Liked Songs</Text>
          {likedTracks.length ? (
            <TouchableOpacity onPress={() => router.push('/library/liked-songs')}>
              <Text style={styles.linkLabel}>View all</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {likedTracks.length === 0 ? (
          <StateMessage compact title="No liked songs yet" body="Songs you like will appear here and stay synced with your account." />
        ) : (
          likedTracks.slice(0, 5).map((track) => <TrackRow key={`liked-${track.id}`} track={track} queue={likedTracks} />)
        )}
      </View>

      <View style={styles.trackBlock}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>{isLoading ? 'Loading your library' : 'Recently played'}</Text>
          {recentTracks.length ? (
            <TouchableOpacity onPress={() => router.push('/library/recently-played')}>
              <Text style={styles.linkLabel}>View all</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
        {recentTracks.length === 0 && !isLoading ? (
          <StateMessage compact title="No recent plays yet" body="Your recent listening will appear here once you start playing songs." />
        ) : null}
        {recentTracks.map((track) => <TrackRow key={track.id} track={track} queue={recentTracks} />)}
      </View>

      <View style={styles.trackBlock}>
        <Text style={styles.blockTitle}>Download activity</Text>
        {activeDownloads.length === 0 ? (
          <StateMessage compact title="No active downloads" body="Paused, failed, and in-progress downloads will appear here while your library syncs." />
        ) : (
          activeDownloads.map((item) => (
            <View key={`active-download-${item.id}`} style={styles.downloadActivityRow}>
              <View style={styles.collectionMeta}>
                <Text style={styles.collectionTitle}>{item.track.title}</Text>
                <Text style={styles.collectionSubtitle}>
                  {item.status === 'downloading'
                    ? `Downloading • ${Math.round(item.progress * 100)}%`
                    : item.status === 'paused'
                      ? 'Paused download'
                      : 'Download failed • tap the icon on the track to retry'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.trackBlock}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Downloaded</Text>
          {downloadedTracks.length ? (
            <TouchableOpacity onPress={() => router.push('/library/downloaded')}>
              <Text style={styles.linkLabel}>View all</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {downloadedTracks.length === 0 ? (
          <StateMessage compact title="No offline songs yet" body="Songs you download for offline playback will appear here." />
        ) : (
          downloadedTracks.map((track) => <TrackRow key={`download-${track.id}`} track={track} queue={downloadedTracks} />)
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  chips: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  collection: {
    gap: 14,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collectionArt: {
    width: 58,
    height: 58,
    borderRadius: 6,
  },
  collectionMeta: {
    flex: 1,
    gap: 4,
  },
  downloadActivityRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  collectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  collectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  trackBlock: {
    gap: 14,
  },
  blockTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  artistRow: {
    gap: 16,
    paddingRight: 16,
  },
  linkLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  guestScreen: {
    justifyContent: 'center',
    minHeight: '100%',
  },
  guestCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  guestCopy: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: colors.text,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryButtonLabel: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryButtonLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
