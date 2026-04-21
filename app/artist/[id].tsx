import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { AlbumCard, TrackRow } from '../../src/components/media';
import { ArtworkImage } from '../../src/components/artwork-image';
import { StateMessage } from '../../src/components/state-message';
import { useArtistDetail } from '../../src/hooks/use-artist-detail';
import { useArtistFollowStatus, useToggleArtistFollow } from '../../src/hooks/use-artist-follow';
import { useAuthStore } from '../../src/store/auth-store';
import { colors } from '../../src/theme/colors';

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useArtistDetail(id);
  const artist = data?.artist ?? null;
  const albums = data?.albums ?? [];
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const followStatus = useArtistFollowStatus(artist ?? undefined);
  const toggleFollow = useToggleArtistFollow(artist ?? undefined);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (!artist) {
    return (
      <Screen>
        <StateMessage title="Artist not found" body="We couldn't find this artist in the live catalog. It may have been removed or is not public yet." />
      </Screen>
    );
  }

  const queue = data?.songs ?? [];

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={[artist.palette[0], '#121212', '#090909']} style={styles.header}>
        <ArtworkImage uri={artist.artworkUrl} palette={artist.palette} style={styles.avatar} />
        <Text style={styles.artistName}>{artist.name}</Text>
        <Text style={styles.listeners}>{artist.monthlyListeners}</Text>
        <View style={styles.statsRow}>
          {artist.songCount ? (
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>{artist.songCount} songs</Text>
            </View>
          ) : null}
          {artist.albumCount ? (
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>{artist.albumCount} releases</Text>
            </View>
          ) : null}
          {artist.genre ? (
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>{artist.genre}</Text>
            </View>
          ) : null}
        </View>
        {artist.city || artist.country ? <Text style={styles.location}>{[artist.city, artist.country].filter(Boolean).join(', ')}</Text> : null}
        {artist.bio ? <Text style={styles.bio}>{artist.bio}</Text> : null}
        <TouchableOpacity
          style={[styles.followButton, followStatus.data ? styles.followingButton : null]}
          onPress={() => toggleFollow.mutate()}
          disabled={!isAuthenticated || toggleFollow.isPending || !artist.sourceId}
        >
          {toggleFollow.isPending ? (
            <ActivityIndicator color={followStatus.data ? colors.text : colors.background} />
          ) : (
            <>
              <Ionicons name={followStatus.data ? 'checkmark' : 'add'} size={18} color={followStatus.data ? colors.text : colors.background} />
              <Text style={[styles.followLabel, followStatus.data ? styles.followingLabel : null]}>
                {followStatus.data ? 'Following' : 'Follow artist'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Popular</Text>
        {queue.length > 0 ? queue.map((track) => <TrackRow key={track.id} track={track} queue={queue} />) : <StateMessage compact title="No live tracks yet" body="Tracks by this artist will appear here once published songs are available in the catalog." />}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Releases</Text>
        {albums.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </ScrollView>
        ) : (
          <StateMessage compact title="No releases yet" body="Albums and EPs from this artist will appear here as soon as they are live on TesoTunes." />
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
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 30,
  },
  avatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  artistName: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  listeners: {
    color: colors.textMuted,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  location: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  bio: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  followButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  followingButton: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followLabel: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  followingLabel: {
    color: colors.text,
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
