import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { TrackRow } from '../../src/components/media';
import { featuredTracks, findArtistById } from '../../src/data/mock-content';
import { useArtistDetail } from '../../src/hooks/use-artist-detail';
import { useArtistFollowStatus, useToggleArtistFollow } from '../../src/hooks/use-artist-follow';
import { useAuthStore } from '../../src/store/auth-store';
import { colors } from '../../src/theme/colors';

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useArtistDetail(id);
  const artist = data?.artist ?? findArtistById(id);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const followStatus = useArtistFollowStatus(artist ?? undefined);
  const toggleFollow = useToggleArtistFollow(artist ?? undefined);

  if (!artist) {
    return (
      <Screen>
        <Text style={styles.empty}>Artist not found.</Text>
      </Screen>
    );
  }

  const artistTracks = data?.songs?.length ? data.songs : featuredTracks.filter((track) => track.artistId === artist.id);
  const queue = artistTracks.length > 0 ? artistTracks : featuredTracks.slice(0, 3);

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={[artist.palette[0], '#121212', '#090909']} style={styles.header}>
        <LinearGradient colors={artist.palette} style={styles.avatar} />
        <Text style={styles.artistName}>{artist.name}</Text>
        <Text style={styles.listeners}>{artist.monthlyListeners}</Text>
        {artist.bio ? <Text style={styles.bio}>{artist.bio}</Text> : null}
        <TouchableOpacity
          style={[styles.followButton, followStatus.data ? styles.followingButton : null]}
          onPress={() => void toggleFollow.mutateAsync()}
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
        {queue.map((track) => (
          <TrackRow key={track.id} track={track} queue={queue} />
        ))}
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
  empty: {
    color: colors.text,
    fontSize: 16,
  },
});
