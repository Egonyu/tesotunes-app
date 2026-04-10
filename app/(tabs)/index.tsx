import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AlbumCard, ArtistCard, MixTile, SectionHeader, TrackRow } from '../../src/components/media';
import { Screen } from '../../src/components/screen';
import { quickMixes } from '../../src/data/mock-content';
import { useMobileHome } from '../../src/hooks/use-mobile-home';
import { colors } from '../../src/theme/colors';

export default function HomeScreen() {
  const { data, isLoading } = useMobileHome();
  const albums = data?.albums ?? [];
  const artists = data?.artists ?? [];
  const tracks = data?.tracks ?? [];

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={['#4f1d1d', '#121212', '#090909']} style={styles.hero}>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Good evening</Text>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </View>

        <View style={styles.mixGrid}>
          {quickMixes.map((mix) => (
            <MixTile key={mix} label={mix} />
          ))}
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <SectionHeader title="Made for you" action="See all" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Popular artists" action="See all" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader title={isLoading ? 'Loading music' : 'Jump back in'} />
        <View style={styles.trackList}>
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} queue={tracks} />
          ))}
        </View>
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
