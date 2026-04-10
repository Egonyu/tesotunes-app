import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../src/components/screen';
import { TrackRow } from '../../src/components/media';
import { featuredTracks, findAlbumById } from '../../src/data/mock-content';
import { colors } from '../../src/theme/colors';

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const album = findAlbumById(id);

  if (!album) {
    return (
      <Screen>
        <Text style={styles.empty}>Album not found.</Text>
      </Screen>
    );
  }

  const queue = album.tracks.length > 0 ? album.tracks : featuredTracks;

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={[album.palette[0], '#121212', '#090909']} style={styles.header}>
        <LinearGradient colors={album.palette} style={styles.coverArt} />
        <Text style={styles.title}>{album.title}</Text>
        <Text style={styles.description}>{album.description}</Text>
        <Text style={styles.meta}>
          Album • {album.artist} • {album.year}
        </Text>
      </LinearGradient>

      <View style={styles.trackList}>
        {queue.map((track) => (
          <TrackRow key={track.id} track={track} queue={queue} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
  },
  coverArt: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  meta: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  trackList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  empty: {
    color: colors.text,
    fontSize: 16,
  },
});
