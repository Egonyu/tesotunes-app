import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { useMyPlaylists } from '../../src/hooks/use-playlists';
import { colors } from '../../src/theme/colors';

export default function PlaylistsScreen() {
  const { data, isLoading } = useMyPlaylists();
  const playlists = data ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Playlists</Text>
          <Text style={styles.subtitle}>Collections you can play, edit, and keep growing.</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/playlists/new')}>
          <Ionicons name="add" size={22} color={colors.background} />
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

      <ScrollView contentContainerStyle={styles.list}>
        {playlists.map((playlist) => (
          <TouchableOpacity key={playlist.id} style={styles.card} onPress={() => router.push(`/playlists/${playlist.id}`)}>
            <LinearGradient colors={playlist.palette} style={styles.artwork} />
            <View style={styles.meta}>
              <Text style={styles.name}>{playlist.name}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {playlist.description}
              </Text>
              <Text style={styles.stats}>
                {playlist.songCount} songs • {playlist.isPublic ? 'Public' : 'Private'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {!isLoading && playlists.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No playlists yet</Text>
            <Text style={styles.emptyCopy}>Create your first playlist and start shaping your library.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/playlists/new')}>
              <Text style={styles.emptyButtonLabel}>Create Playlist</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
  artwork: {
    width: 84,
    height: 84,
    borderRadius: 14,
  },
  meta: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  stats: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyButtonLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
});
