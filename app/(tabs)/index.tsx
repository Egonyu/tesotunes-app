import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AlbumCard, ArtistCard, ChartCard, MixTile, SectionHeader, TrackRow } from '../../src/components/media';
import { Screen } from '../../src/components/screen';
import { StateMessage } from '../../src/components/state-message';
import { useMobileHome } from '../../src/hooks/use-mobile-home';
import { colors } from '../../src/theme/colors';

export default function HomeScreen() {
  const { data, isLoading } = useMobileHome();
  const albums = data?.albums ?? [];
  const artists = data?.artists ?? [];
  const tracks = data?.tracks ?? [];
  const charts = data?.charts ?? [];
  const spotlight = [
    ...charts.slice(0, 2).map((chart) => ({ key: `chart-${chart.id}`, label: chart.genre, path: `/charts/${chart.sourceId ?? chart.id}` })),
    ...albums.slice(0, 2).map((album) => ({ key: `album-${album.id}`, label: album.title, path: `/album/${album.sourceId ?? album.id}` })),
    ...artists.slice(0, 2).map((artist) => ({ key: `artist-${artist.id}`, label: artist.name, path: `/artist/${artist.sourceId ?? artist.id}` })),
  ].slice(0, 6);
  const fallbackSpotlight = [
    { key: 'browse-genres', label: 'Browse Genres', path: '/genres' },
    { key: 'browse-artists', label: 'Browse Artists', path: '/artists' },
    { key: 'browse-albums', label: 'Browse Albums', path: '/albums' },
    { key: 'browse-search', label: 'Search Music', path: '/search' },
  ];

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={['#4f1d1d', '#121212', '#090909']} style={styles.hero}>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Good evening</Text>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </View>

        <View style={styles.mixGrid}>
          {(spotlight.length > 0 ? spotlight : fallbackSpotlight).map((item) => (
            <MixTile key={item.key} label={item.label} onPress={() => router.push(item.path as never)} />
          ))}
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <SectionHeader title="Made for you" action="See all" onActionPress={() => router.push('/albums' as never)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </ScrollView>
        {!albums.length && !isLoading ? (
          <StateMessage compact title="No albums yet" body="Albums will appear here as soon as they are published to the live catalog." actionLabel="Browse artists" onActionPress={() => router.push('/artists' as never)} />
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Popular artists" action="Browse" onActionPress={() => router.push('/artists' as never)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </ScrollView>
        {!artists.length && !isLoading ? (
          <StateMessage compact title="No artists yet" body="Popular artists will show up here once the live catalog expands." actionLabel="Open search" onActionPress={() => router.push('/search' as never)} />
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Featured charts" action="Explore" onActionPress={() => router.push('/charts' as never)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {charts.map((chart) => (
            <ChartCard key={chart.id} chart={chart} onPress={() => router.push(`/charts/${chart.sourceId ?? chart.id}` as never)} />
          ))}
        </ScrollView>
        {!charts.length && !isLoading ? (
          <StateMessage compact title="No charts yet" body="Charts will appear here once enough genre activity lands in production." actionLabel="Browse genres" onActionPress={() => router.push('/genres' as never)} />
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title={isLoading ? 'Loading music' : 'Jump back in'} />
        <View style={styles.trackList}>
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} queue={tracks} />
          ))}
        </View>
        {!tracks.length && !isLoading ? (
          <StateMessage compact title="No songs yet" body="Trending songs will appear here when the API returns live catalog data." actionLabel="Search catalog" onActionPress={() => router.push('/search' as never)} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 18,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  mixGrid: {
    paddingTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  section: {
    gap: 16,
    paddingHorizontal: 16,
  },
  rail: {
    gap: 16,
    paddingRight: 16,
  },
  trackList: {
    gap: 14,
  },
});
