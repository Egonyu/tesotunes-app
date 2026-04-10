import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { SearchTile, SectionHeader } from '../../src/components/media';
import { searchGenres } from '../../src/data/mock-content';
import { colors } from '../../src/theme/colors';

export default function SearchScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#1f2937" />
          <TextInput
            placeholder="What do you want to listen to?"
            placeholderTextColor="#4b5563"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Browse all" />
        <View style={styles.grid}>
          {searchGenres.map((genre) => (
            <SearchTile key={genre.title} label={genre.title} palette={genre.palette} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 18,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  searchBar: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
});
