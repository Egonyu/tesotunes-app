import { router } from 'expo-router';
import { startTransition, useDeferredValue, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../src/components/app-header';
import { ArtworkImage } from '../../src/components/artwork-image';
import { Screen } from '../../src/components/screen';
import { AlbumCard, ArtistCard, ChartCard, GenreCard, SearchTile, SectionHeader, TrackRow } from '../../src/components/media';
import { useSearchBrowse, useSearchResults } from '../../src/hooks/use-search-discovery';
import { colors } from '../../src/theme/colors';
import { StateMessage } from '../../src/components/state-message';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const browseQuery = useSearchBrowse();
  const resultsQuery = useSearchResults(deferredQuery);
  const genres = browseQuery.data?.genres ?? [];
  const charts = browseQuery.data?.charts ?? [];
  const searchResults = resultsQuery.data;
  const showResults = deferredQuery.trim().length >= 2;
  const isSearchTransitioning = query !== deferredQuery;
  const resultSections = [
    { key: 'songs', title: 'Songs', count: searchResults?.songs.length ?? 0 },
    { key: 'artists', title: 'Artists', count: searchResults?.artists.length ?? 0 },
    { key: 'albums', title: 'Albums', count: searchResults?.albums.length ?? 0 },
    { key: 'playlists', title: 'Playlists', count: searchResults?.playlists.length ?? 0 },
  ];
  const resultTotal = resultSections.reduce((sum, section) => sum + section.count, 0);

  return (
    <Screen>
      <View style={styles.header}>
        <AppHeader
          eyebrow="Discovery"
          title="Search"
          subtitle="Find songs, artists, albums, playlists, charts, and genres from the live TesoTunes catalog."
          actions={[
            {
              icon: 'stats-chart-outline',
              accessibilityLabel: 'Open charts',
              onPress: () => router.push('/charts' as never),
            },
            {
              icon: 'person-circle-outline',
              accessibilityLabel: 'Open account hub',
              onPress: () => router.push('/more' as never),
            },
          ]}
        />
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#1f2937" />
          <TextInput
            placeholder="What do you want to listen to?"
            placeholderTextColor="#4b5563"
            style={styles.input}
            value={query}
            onChangeText={(value) => {
              startTransition(() => {
                setQuery(value);
              });
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {isSearchTransitioning ? <Text style={styles.searchHint}>Refreshing results...</Text> : null}
      </View>

      {showResults ? (
        <>
          {resultsQuery.isLoading ? <ActivityIndicator color={colors.accent} /> : null}

          {!resultsQuery.isLoading ? (
            <View style={styles.summaryRow}>
              {resultSections.map((section) => (
                <View key={section.key} style={styles.summaryCard}>
                  <Text style={styles.summaryCount}>{section.count}</Text>
                  <Text style={styles.summaryLabel}>{section.title}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {searchResults?.songs?.length ? (
            <View style={styles.section}>
              <SectionHeader title="Songs" action={`${searchResults.songs.length} matches`} />
              <View style={styles.list}>
                {searchResults.songs.map((track) => (
                  <TrackRow key={track.id} track={track} queue={searchResults.songs} />
                ))}
              </View>
            </View>
          ) : null}

          {searchResults?.artists?.length ? (
            <View style={styles.section}>
              <SectionHeader title="Artists" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                {searchResults.artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </ScrollView>
            </View>
          ) : resultTotal > 0 && !resultsQuery.isLoading ? (
            <StateMessage compact title="No artists matched" body="Try searching with the exact artist name or browse genres to discover more artists." />
          ) : null}

          {searchResults?.albums?.length ? (
            <View style={styles.section}>
              <SectionHeader title="Albums" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                {searchResults.albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </ScrollView>
            </View>
          ) : resultTotal > 0 && !resultsQuery.isLoading ? (
            <StateMessage compact title="No albums matched" body="The current query returned no albums. Try a song title, artist name, or a broader keyword." />
          ) : null}

          {searchResults?.playlists?.length ? (
            <View style={styles.section}>
              <SectionHeader title="Playlists" />
              <View style={styles.list}>
                {searchResults.playlists.map((playlist) => (
                  <TouchableOpacity key={playlist.id} style={styles.playlistRow} onPress={() => router.push(`/playlists/${playlist.id}`)}>
                    <ArtworkImage uri={playlist.artworkUrl} palette={playlist.palette} style={styles.playlistArt} />
                    <View style={styles.playlistMeta}>
                      <Text style={styles.playlistTitle}>{playlist.name}</Text>
                      <Text style={styles.playlistSubtitle}>{playlist.songCount} songs</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : resultTotal > 0 && !resultsQuery.isLoading ? (
            <StateMessage compact title="No playlists matched" body="Playlists will appear here when the query matches live public or personal playlist data." />
          ) : null}

          {!resultsQuery.isLoading && resultSections.every((section) => section.count === 0) ? (
            <View style={styles.section}>
              <StateMessage title="No results yet" body={`Nothing matched "${query.trim()}". Try another title, artist, album, or playlist name.`} />
            </View>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.section}>
            <SectionHeader title="Top charts" action="See all" onActionPress={() => router.push('/charts' as never)} />
            {browseQuery.isLoading ? <ActivityIndicator color={colors.accent} /> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
              {charts.map((chart) => (
                <ChartCard key={chart.id} chart={chart} onPress={() => router.push(`/charts/${chart.sourceId ?? chart.id}` as never)} />
              ))}
            </ScrollView>
            {!charts.length && !browseQuery.isLoading ? (
              <StateMessage compact title="No charts yet" body="Charts will appear here once enough live genre data is available in production." />
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Browse genres" action="See all" onActionPress={() => router.push('/genres' as never)} />
            {browseQuery.isLoading ? <ActivityIndicator color={colors.accent} /> : null}
            <View style={styles.grid}>
              {genres.map((genre) => (
                <GenreCard key={genre.id} genre={genre} onPress={() => router.push(`/genre/${genre.sourceId ?? genre.id}` as never)} />
              ))}
            </View>
            {!genres.length && !browseQuery.isLoading ? <StateMessage compact title="No genres yet" body="Genres will appear here when the API returns more live catalog metadata." /> : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 18,
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
  searchHint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    marginTop: -8,
  },
  list: {
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '22%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  summaryCount: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  rail: {
    gap: 16,
    paddingRight: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playlistArt: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  playlistMeta: {
    flex: 1,
    gap: 4,
  },
  playlistTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  playlistSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
