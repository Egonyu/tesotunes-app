import { router } from 'expo-router';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ChartCard } from '../../src/components/media';
import { useSearchBrowse } from '../../src/hooks/use-search-discovery';
import { colors } from '../../src/theme/colors';
import { StateMessage } from '../../src/components/state-message';

export default function ChartsBrowseScreen() {
  const { data, isLoading } = useSearchBrowse();
  const charts = data?.charts ?? [];

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
  cardWrap: {
    flex: 1,
  },
});
