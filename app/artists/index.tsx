import { router } from 'expo-router';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ArtistCard } from '../../src/components/media';
import { useBrowseArtists } from '../../src/hooks/use-browse-catalog';
import { colors } from '../../src/theme/colors';
import { StateMessage } from '../../src/components/state-message';

export default function ArtistsBrowseScreen() {
  const { data, isLoading } = useBrowseArtists();
  const artists = data ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={artists}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Artists</Text>
            <Text style={styles.title}>Popular artists</Text>
            <Text style={styles.subtitle}>The voices currently shaping the TesoTunes catalog.</Text>
            {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ArtistCard artist={item} />
          </View>
        )}
        ListEmptyComponent={!isLoading ? <StateMessage title="No artists yet" body="Popular artists will appear here as more live catalog data becomes available." /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 140, gap: 18 },
  header: { gap: 10, paddingBottom: 6 },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  row: { justifyContent: 'space-between', gap: 12 },
  cardWrap: { flex: 1 },
});
