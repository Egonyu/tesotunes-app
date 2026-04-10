import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { ArtistCard, TrackRow } from '../../src/components/media';
import { artists, featuredTracks, libraryHighlights } from '../../src/data/mock-content';
import { useMyPlaylists } from '../../src/hooks/use-playlists';
import { useUserLibrary } from '../../src/hooks/use-user-library';
import { apiGet, getApiBaseUrl } from '../../src/services/api/client';
import { signOut } from '../../src/services/auth/session';
import { useAuthStore } from '../../src/store/auth-store';
import { useDownloadStore } from '../../src/store/download-store';
import { colors } from '../../src/theme/colors';

export default function LibraryScreen() {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useUserLibrary();
  const { data: playlists } = useMyPlaylists();
  const localDownloads = useDownloadStore((state) => state.downloads);
  const isAuthenticated = authStatus === 'authenticated';
  const recentTracks = data?.recentPlays?.length ? data.recentPlays : featuredTracks.slice(0, 3);
  const likedTracks = data?.likedSongs ?? [];
  const followedArtists = data?.followedArtists?.length ? data.followedArtists : artists.slice(0, 4);
  const downloadedTracks = localDownloads.filter((item) => item.status === 'completed').map((item) => item.track);
  const activeDownloads = localDownloads.filter((item) => item.status !== 'completed');
  const downloadCount = localDownloads.length || data?.counts?.downloads || 0;
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  async function testApiConnection() {
    setDiagnostic('Testing API...');

    try {
      const response = await apiGet<{ data?: unknown[] }>('/mobile/trending/songs');
      setDiagnostic(`API reachable at ${getApiBaseUrl()} with ${response.data?.length ?? 0} songs.`);
    } catch (error) {
      setDiagnostic(error instanceof Error ? error.message : 'API test failed');
    }
  }

  if (!isAuthenticated) {
    return (
      <Screen contentContainerStyle={styles.guestScreen}>
        <View style={styles.guestCard}>
          <Text style={styles.title}>Your Library</Text>
          <Text style={styles.guestCopy}>
            Sign in to sync liked songs, playlists, downloads, and your listening history across devices.
          </Text>
          <Text style={styles.debugLabel}>Build marker: library-debug-v1</Text>
          <Text style={styles.debugLabel}>API: {getApiBaseUrl()}</Text>
          {diagnostic ? <Text style={styles.debugLabel}>{diagnostic}</Text> : null}
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={() => router.push('/sign-in')}>
            <Text style={styles.primaryButtonLabel}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.push('/sign-up')}>
            <Text style={styles.secondaryButtonLabel}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={testApiConnection}>
            <Text style={styles.secondaryButtonLabel}>Test API Connection</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerMeta}>
          <Text style={styles.title}>Your Library</Text>
          <Text style={styles.userLabel}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => void signOut()}>
          <Ionicons name="log-out-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.chips}>
        {[
          { label: 'Playlists', action: () => router.push('/playlists') },
          { label: `Downloads ${downloadCount > 0 ? `(${downloadCount})` : ''}`.trim() },
          { label: `Artists ${followedArtists.length > 0 ? `(${followedArtists.length})` : ''}`.trim() },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.chip} activeOpacity={0.85} onPress={item.action}>
            <Text style={styles.chipLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.collection}>
        {libraryHighlights.map((item, index) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.85}
            style={styles.collectionRow}
            onPress={item === 'Liked Songs' ? undefined : item === 'Downloaded' ? undefined : item === 'Following' ? undefined : undefined}
          >
            <View style={[styles.collectionArt, { backgroundColor: index === 0 ? '#2a2a7d' : '#2b2b2b' }]} />
            <View style={styles.collectionMeta}>
              <Text style={styles.collectionTitle}>{item}</Text>
              <Text style={styles.collectionSubtitle}>
                {item === 'Liked Songs'
                  ? `${likedTracks.length || data?.counts?.liked_songs || 0} saved tracks`
                  : item === 'Downloaded'
                    ? 'Music for offline listening'
                    : item === 'Following'
                      ? `${data?.counts?.followed_artists || 0} artists followed`
                      : item === 'Recently Played'
                        ? 'Your most recent listening'
                        : 'Playlist • TesoTunes'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.trackBlock}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Following</Text>
          <Text style={styles.linkLabel}>{data?.counts?.followed_artists ?? followedArtists.length} artists</Text>
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
        {!playlists?.length ? <Text style={styles.emptyText}>Create playlists to organize your music and mixes.</Text> : null}
      </View>

      <View style={styles.trackBlock}>
        <Text style={styles.blockTitle}>Liked Songs</Text>
        {likedTracks.length === 0 ? (
          <Text style={styles.emptyText}>Songs you like will appear here.</Text>
        ) : (
          likedTracks.slice(0, 5).map((track) => <TrackRow key={`liked-${track.id}`} track={track} queue={likedTracks} />)
        )}
      </View>

      <View style={styles.trackBlock}>
        <Text style={styles.blockTitle}>{isLoading ? 'Loading your library' : 'Recently played'}</Text>
        {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
        {recentTracks.map((track) => (
          <TrackRow key={track.id} track={track} queue={recentTracks} />
        ))}
      </View>

      <View style={styles.trackBlock}>
        <Text style={styles.blockTitle}>Download activity</Text>
        {activeDownloads.length === 0 ? (
          <Text style={styles.emptyText}>Paused, failed, and in-progress downloads will appear here.</Text>
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
        <Text style={styles.blockTitle}>Downloaded</Text>
        {downloadedTracks.length === 0 ? (
          <Text style={styles.emptyText}>Songs you download for offline playback will appear here.</Text>
        ) : (
          downloadedTracks.map((track) => <TrackRow key={`download-${track.id}`} track={track} queue={downloadedTracks} />)
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerMeta: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  userLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
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
  debugLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 18,
  },
});
