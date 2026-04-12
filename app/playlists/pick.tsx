import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ArtworkImage } from '../../src/components/artwork-image';
import { Screen } from '../../src/components/screen';
import { StateMessage } from '../../src/components/state-message';
import { useAddTrackToPlaylist, useMyPlaylists } from '../../src/hooks/use-playlists';
import { colors } from '../../src/theme/colors';

export default function PlaylistPickerScreen() {
  const { trackId, trackTitle } = useLocalSearchParams<{ trackId: string; trackTitle?: string }>();
  const { data, isLoading } = useMyPlaylists();
  const addTrackToPlaylist = useAddTrackToPlaylist();
  const playlists = data ?? [];

  async function handleAdd(playlistId: string) {
    if (!trackId) {
      return;
    }

    await addTrackToPlaylist.mutateAsync({
      playlistId,
      trackId: Number(trackId),
    });

    router.back();
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Add To Playlist</Text>
        <Text style={styles.subtitle}>
          {trackTitle ? `"${trackTitle}"` : 'This track'} can be saved into one of your collections.
        </Text>
      </View>

      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

      <ScrollView contentContainerStyle={styles.list}>
        <TouchableOpacity style={styles.createCard} onPress={() => router.push('/playlists/new')}>
          <View style={styles.createIcon}>
            <Text style={styles.createIconLabel}>+</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.name}>Create new playlist</Text>
            <Text style={styles.description}>Start a fresh collection for this song.</Text>
          </View>
        </TouchableOpacity>

        {playlists.map((playlist) => (
          <TouchableOpacity key={playlist.id} style={styles.card} onPress={() => void handleAdd(playlist.id)}>
            <ArtworkImage uri={playlist.artworkUrl} palette={playlist.palette} style={styles.artwork} />
            <View style={styles.meta}>
              <Text style={styles.name}>{playlist.name}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {playlist.songCount} songs • {playlist.isPublic ? 'Public' : 'Private'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {!isLoading && playlists.length === 0 ? (
          <StateMessage compact title="No playlists yet" body="Create a playlist first, then come back to save this track." />
        ) : null}

        {addTrackToPlaylist.error ? <Text style={styles.error}>{addTrackToPlaylist.error.message}</Text> : null}
      </ScrollView>
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
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    gap: 14,
    paddingBottom: 140,
  },
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
  },
  createCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    padding: 14,
  },
  createIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createIconLabel: {
    color: colors.background,
    fontSize: 30,
    fontWeight: '800',
  },
  artwork: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  meta: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
