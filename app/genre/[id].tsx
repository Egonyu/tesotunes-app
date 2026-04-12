import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AlbumCard, ArtistCard, TrackRow } from '../../src/components/media';
import { Screen } from '../../src/components/screen';
import { useGenreDetail } from '../../src/hooks/use-genre-detail';
import { StateMessage } from '../../src/components/state-message';
import { colors } from '../../src/theme/colors';

export default function GenreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useGenreDetail(id);
  const genre = data?.genre ?? null;
  const songs = data?.songs ?? [];
  const artists = data?.artists ?? [];
  const albums = data?.albums ?? [];

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (!genre) {
    return (
      <Screen>
        <StateMessage title="Genre not found" body="We couldn't find this genre in the live catalog. It may not be available publicly yet." />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={[genre.palette[0], '#121212', '#090909']} style={styles.header}>
        <Text style={styles.title}>{genre.name}</Text>
        <Text style={styles.subtitle}>{genre.songCount} songs shaping this chart right now.</Text>
        {genre.description ? <Text style={styles.description}>{genre.description}</Text> : null}
      </LinearGradient>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Top tracks</Text>
        {songs.length > 0 ? songs.map((track) => <TrackRow key={track.id} track={track} queue={songs} />) : <StateMessage compact title="No songs in this genre yet" body="This genre view will populate as soon as published songs are tagged here." />}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Artists in this lane</Text>
        {artists.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </ScrollView>
        ) : (
          <StateMessage compact title="No artists yet" body="Artists will appear here once more of the catalog is tagged to this genre." />
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Albums and projects</Text>
        {albums.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </ScrollView>
        ) : (
          <StateMessage compact title="No albums yet" body="Albums for this genre will appear here as soon as matching releases go live." />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 30,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  block: {
    gap: 14,
    paddingHorizontal: 16,
  },
  blockTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  rail: {
    gap: 16,
    paddingRight: 16,
  },
});
