import { router } from 'expo-router';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { GenreCard } from '../../src/components/media';
import { useSearchBrowse } from '../../src/hooks/use-search-discovery';
import { colors } from '../../src/theme/colors';
import { StateMessage } from '../../src/components/state-message';

export default function GenresBrowseScreen() {
  const { data, isLoading } = useSearchBrowse();
  const genres = data?.genres ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={genres}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Browse</Text>
            <Text style={styles.title}>Genres</Text>
            <Text style={styles.subtitle}>
              Explore the live catalog by sound, scene, and local momentum.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <GenreCard genre={item} onPress={() => router.push(`/genre/${item.sourceId ?? item.id}` as never)} />
          </View>
        )}
        ListEmptyComponent={!isLoading ? <StateMessage title="No genres yet" body="Genres will appear here once the live API exposes more catalog metadata." actionLabel="Open search" onActionPress={() => router.push('/search' as never)} /> : null}
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
