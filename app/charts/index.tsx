import { router } from 'expo-router';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ChartCard } from '../../src/components/media';
import { useSearchBrowse } from '../../src/hooks/use-search-discovery';
import { colors } from '../../src/theme/colors';
import { StateMessage } from '../../src/components/state-message';

export default function ChartsBrowseScreen() {
  const { data, isLoading } = useSearchBrowse();
  const charts = data?.charts ?? [];
  const totalTracks = charts.reduce((sum, chart) => sum + chart.songCount, 0);
  const leadChart = charts[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={charts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Discovery</Text>
            <Text style={styles.title}>Featured charts</Text>
            <Text style={styles.subtitle}>
              Real-time genre lanes and replay momentum from the live TesoTunes catalog.
            </Text>
            {charts.length > 0 ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{charts.length}</Text>
                  <Text style={styles.summaryLabel}>Active charts</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{totalTracks}</Text>
                  <Text style={styles.summaryLabel}>Tracks ranked</Text>
                </View>
                <View style={styles.summaryCardWide}>
                  <Text style={styles.summaryValue}>{leadChart?.genre ?? 'Live'}</Text>
                  <Text style={styles.summaryLabel}>{leadChart?.momentumLabel ?? 'Momentum lane'}</Text>
                </View>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ChartCard chart={item} onPress={() => router.push(`/charts/${item.sourceId ?? item.id}` as never)} />
          </View>
        )}
        ListEmptyComponent={!isLoading ? <StateMessage title="No charts yet" body="Featured charts will show here as soon as the production catalog has enough live activity." actionLabel="Browse genres" onActionPress={() => router.push('/genres' as never)} /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 18,
  },
  header: {
    gap: 10,
    paddingBottom: 6,
  },
  eyebrow: {
    color: colors.accent,
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
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  summaryCard: {
    width: '31%',
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 4,
  },
  summaryCardWide: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  cardWrap: {
    flex: 1,
  },
});
