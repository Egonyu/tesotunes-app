import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { TrackRow } from '../../src/components/media';
import { findPlaylistById } from '../../src/data/mock-content';
import { usePlaylistDetail, useRemoveTrackFromPlaylist, useReorderPlaylistTracks } from '../../src/hooks/use-playlists';
import { colors } from '../../src/theme/colors';
import { Track } from '../../src/types/music';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = usePlaylistDetail(id);
  const playlist = data ?? findPlaylistById(id);
  const [displayTracks, setDisplayTracks] = useState<Track[]>([]);
  const [playlistActionError, setPlaylistActionError] = useState<string | null>(null);
  const removeTrack = useRemoveTrackFromPlaylist(id);
  const reorderTracks = useReorderPlaylistTracks(id);

  useEffect(() => {
    setDisplayTracks(playlist?.tracks?.length ? playlist.tracks : []);
  }, [playlist]);

  if (!playlist && !isLoading) {
    return (
      <Screen>
        <Text style={styles.empty}>Playlist not found.</Text>
      </Screen>
    );
  }

  const queue = displayTracks;

  async function handleRemoveTrack(track: Track) {
    if (!playlist?.canEdit) {
      return;
    }

    if (typeof track.sourceId !== 'number') {
      setPlaylistActionError('This track cannot be removed yet because it has no source id.');
      return;
    }

    setPlaylistActionError(null);
    const previousTracks = displayTracks;
    setDisplayTracks((current) => current.filter((item) => item.id !== track.id));

    try {
      await removeTrack.mutateAsync(track.sourceId);
    } catch (error) {
      setDisplayTracks(previousTracks);
      setPlaylistActionError(error instanceof Error ? error.message : 'Unable to remove track from playlist');
    }
  }

  async function handleMoveTrack(index: number, direction: -1 | 1) {
    if (!playlist?.canEdit) {
      return;
    }

    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= displayTracks.length) {
      return;
    }

    const hasSourceIds = displayTracks.every((track) => typeof track.sourceId === 'number');

    if (!hasSourceIds) {
      setPlaylistActionError('This playlist cannot be reordered yet because some tracks have no source ids.');
      return;
    }

    const reordered = [...displayTracks];
    const previousTracks = displayTracks;
    const [movedTrack] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, movedTrack);

    setPlaylistActionError(null);
    setDisplayTracks(reordered);

    try {
      await reorderTracks.mutateAsync(reordered.map((track) => track.sourceId!));
    } catch (error) {
      setDisplayTracks(previousTracks);
      setPlaylistActionError(error instanceof Error ? error.message : 'Unable to reorder playlist');
    }
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
      {playlist ? (
        <>
          <LinearGradient colors={[playlist.palette[0], '#121212', '#090909']} style={styles.header}>
            <LinearGradient colors={playlist.palette} style={styles.coverArt} />
            <Text style={styles.title}>{playlist.name}</Text>
            <Text style={styles.description}>{playlist.description}</Text>
            <Text style={styles.meta}>
              Playlist • {playlist.songCount} songs • {playlist.ownerName || 'TesoTunes'}
            </Text>
            {playlist.canEdit ? (
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.85}
                onPress={() => router.push(`/playlists/edit/${playlist.id}`)}
              >
                <Text style={styles.editButtonLabel}>Edit playlist</Text>
              </TouchableOpacity>
            ) : null}
          </LinearGradient>

          <View style={styles.trackList}>
            {playlistActionError ? <Text style={styles.error}>{playlistActionError}</Text> : null}
            {queue.length > 0 ? (
              queue.map((track, index) => (
                <View key={track.id} style={styles.trackItem}>
                  <TrackRow track={track} queue={queue} />
                  {playlist.canEdit ? (
                    <View style={styles.trackActions}>
                      <TouchableOpacity
                        style={styles.trackActionButton}
                        activeOpacity={0.85}
                        disabled={index === 0 || reorderTracks.isPending}
                        onPress={() => void handleMoveTrack(index, -1)}
                      >
                        <Ionicons name="arrow-up-outline" size={16} color={index === 0 ? colors.textSubtle : colors.text} />
                        <Text style={[styles.trackActionLabel, index === 0 ? styles.trackActionDisabled : null]}>Up</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.trackActionButton}
                        activeOpacity={0.85}
                        disabled={index === queue.length - 1 || reorderTracks.isPending}
                        onPress={() => void handleMoveTrack(index, 1)}
                      >
                        <Ionicons
                          name="arrow-down-outline"
                          size={16}
                          color={index === queue.length - 1 ? colors.textSubtle : colors.text}
                        />
                        <Text style={[styles.trackActionLabel, index === queue.length - 1 ? styles.trackActionDisabled : null]}>
                          Down
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.trackActionButton}
                        activeOpacity={0.85}
                        disabled={removeTrack.isPending}
                        onPress={() => void handleRemoveTrack(track)}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        <Text style={[styles.trackActionLabel, styles.removeLabel]}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.empty}>Songs added to this playlist will appear here.</Text>
            )}
          </View>
        </>
      ) : null}
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
    paddingBottom: 24,
  },
  coverArt: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  meta: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  editButton: {
    marginTop: 4,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  editButtonLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  trackList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  trackItem: {
    gap: 8,
  },
  trackActions: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 64,
  },
  trackActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackActionLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  trackActionDisabled: {
    color: colors.textSubtle,
  },
  removeLabel: {
    color: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    color: colors.text,
    fontSize: 16,
  },
});
