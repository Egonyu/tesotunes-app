import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ArtworkImage } from '../../src/components/artwork-image';
import { Screen } from '../../src/components/screen';
import { TrackRow } from '../../src/components/media';
import { StateMessage } from '../../src/components/state-message';
import { useAlbumDetail } from '../../src/hooks/use-album-detail';
import { colors } from '../../src/theme/colors';

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: album, isLoading } = useAlbumDetail(id);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (!album) {
    return (
      <Screen>
        <StateMessage title="Album not found" body="We couldn't find this album in the live catalog. It may have been removed or is not public yet." />
      </Screen>
    );
  }

  const queue = album.tracks;

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={[album.palette[0], '#121212', '#090909']} style={styles.header}>
        <ArtworkImage uri={album.artworkUrl} palette={album.palette} style={styles.coverArt} />
        <Text style={styles.title}>{album.title}</Text>
        <Text style={styles.description}>{album.description}</Text>
        <TouchableOpacity onPress={() => (album.artistId ? router.push(`/artist/${album.artistId}` as never) : undefined)} disabled={!album.artistId}>
          <Text style={styles.meta}>
            Album • {album.artist} • {album.year}
          </Text>
        </TouchableOpacity>
        <View style={styles.statsRow}>
          {album.trackCount ? (
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>{album.trackCount} tracks</Text>
            </View>
          ) : null}
          {album.genre ? (
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>{album.genre}</Text>
            </View>
          ) : null}
          {album.playCountLabel ? (
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>{album.playCountLabel}</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.trackList}>
        {queue.length > 0 ? queue.map((track) => <TrackRow key={track.id} track={track} queue={queue} />) : <StateMessage compact title="No tracks available yet" body="Tracks for this album will appear here once the release is fully populated in the live catalog." />}
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  trackList: {
    paddingHorizontal: 16,
    gap: 14,
  },
});
