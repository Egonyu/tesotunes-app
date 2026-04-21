import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AlbumCard, ArtistCard, TrackRow } from '../../src/components/media';
import { Screen } from '../../src/components/screen';
import { useChartDetail } from '../../src/hooks/use-chart-detail';
import { StateMessage } from '../../src/components/state-message';
import { colors } from '../../src/theme/colors';

export default function ChartDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useChartDetail(id);
  const chart = data?.chart ?? null;
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

  if (!chart) {
    return (
      <Screen>
        <StateMessage title="Chart not found" body="We couldn't find this chart in the live catalog yet. It may not be active in production." />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={[chart.palette[0], '#121212', '#090909']} style={styles.header}>
        <Text style={styles.eyebrow}>Featured Chart</Text>
        <Text style={styles.title}>{chart.title}</Text>
        <Text style={styles.subtitle}>{chart.description}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>{chart.songCount} tracks</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>{chart.totalPlays}</Text>
          </View>
          {chart.momentumLabel ? (
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>{chart.momentumLabel}</Text>
            </View>
          ) : null}
          {chart.averagePlaysLabel ? (
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>{chart.averagePlaysLabel}</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Top tracks</Text>
        {songs.length > 0 ? (
          songs.map((track, index) => (
            <View key={track.id} style={styles.rankedTrackRow}>
              <View style={styles.rankPill}>
                <Text style={styles.rankLabel}>{index + 1}</Text>
              </View>
              <View style={styles.rankedTrackContent}>
                <TrackRow track={track} queue={songs} />
              </View>
            </View>
          ))
        ) : (
          <StateMessage compact title="Chart still warming up" body="This chart will fill in as soon as enough live songs are available for this lane." />
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Artists driving this chart</Text>
        {artists.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </ScrollView>
        ) : (
          <StateMessage compact title="No artist highlights yet" body="Artist highlights will appear here once the chart has enough live catalog coverage." />
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Projects in rotation</Text>
        {albums.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </ScrollView>
        ) : (
          <StateMessage compact title="No related releases yet" body="Albums connected to this chart will appear here as more releases enter rotation." />
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
    paddingTop: 28,
    paddingBottom: 30,
    gap: 12,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
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
  rankedTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
  rankLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  rankedTrackContent: {
    flex: 1,
  },
});
