import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { router } from 'expo-router';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePlayerControls } from '../src/hooks/use-player-queue';
import { useTrackLikeStatus, useToggleTrackLike } from '../src/hooks/use-track-likes';
import { Screen } from '../src/components/screen';
import { colors } from '../src/theme/colors';
import { usePlayerStore } from '../src/store/player-store';

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const queue = usePlayerStore((state) => state.queue);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const durationSeconds = usePlayerStore((state) => state.durationSeconds);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const playbackError = usePlayerStore((state) => state.playbackError);
  const { togglePlayback, next, previous, seekTo, seekBackward, seekForward, controlsLoading } = usePlayerControls();
  const likeStatus = useTrackLikeStatus(currentTrack ?? undefined);
  const toggleLike = useToggleTrackLike(currentTrack ?? undefined);
  const [progressWidth, setProgressWidth] = useState(0);

  if (!currentTrack) {
    return (
      <Screen>
        <Text style={styles.empty}>No active track.</Text>
      </Screen>
    );
  }

  const progress = durationSeconds > 0 ? Math.min(currentTime / durationSeconds, 1) : 0;
  const upcomingQueue = queue.filter((track) => track.id !== currentTrack.id).slice(0, 4);

  function handleProgressLayout(event: LayoutChangeEvent) {
    setProgressWidth(event.nativeEvent.layout.width);
  }

  function handleProgressPress(locationX: number) {
    if (durationSeconds <= 0 || progressWidth <= 0) {
      return;
    }

    const ratio = Math.max(0, Math.min(locationX / progressWidth, 1));
    seekTo(durationSeconds * ratio);
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={[currentTrack.palette[0], currentTrack.palette[1], '#090909']} style={styles.hero}>
        <LinearGradient colors={currentTrack.palette} style={styles.artwork} />
        <View style={styles.meta}>
          <View>
            <Text style={styles.title}>{currentTrack.title}</Text>
            <Text style={styles.artist}>{currentTrack.artist}</Text>
            {currentTrack.playbackSource === 'offline' ? <Text style={styles.offlineLabel}>Playing from downloads</Text> : null}
          </View>
          <TouchableOpacity onPress={() => void toggleLike.mutateAsync()} disabled={!currentTrack.sourceId}>
            <Ionicons name={likeStatus.data ? 'heart' : 'heart-outline'} size={24} color={likeStatus.data ? colors.accent : colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressBlock}>
          <Pressable onLayout={handleProgressLayout} onPress={(event) => handleProgressPress(event.nativeEvent.locationX)}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </Pressable>
          <View style={styles.progressMeta}>
            <Text style={styles.progressLabel}>{formatTime(currentTime)}</Text>
            <Text style={styles.progressLabel}>{durationSeconds > 0 ? formatTime(durationSeconds) : currentTrack.duration}</Text>
          </View>
        </View>

        <View style={styles.seekRow}>
          <TouchableOpacity onPress={seekBackward} hitSlop={10} disabled={controlsLoading} style={styles.seekButton}>
            <Ionicons name="play-back-outline" size={20} color={colors.text} />
            <Text style={styles.seekLabel}>10s</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={seekForward} hitSlop={10} disabled={controlsLoading} style={styles.seekButton}>
            <Text style={styles.seekLabel}>10s</Text>
            <Ionicons name="play-forward-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {playbackError ? <Text style={styles.errorLabel}>{playbackError}</Text> : null}
        {isBuffering ? <Text style={styles.bufferingLabel}>Buffering audio...</Text> : null}

        {durationSeconds > 0 ? <Text style={styles.seekHint}>Tap the progress bar to jump to a moment.</Text> : null}

        <View style={styles.controls}>
          <Ionicons name="shuffle" size={22} color={colors.textMuted} />
          <TouchableOpacity onPress={previous} hitSlop={12} disabled={controlsLoading}>
            <Ionicons name="play-skip-back" size={36} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlayback} style={styles.playButton} hitSlop={12}>
            <Ionicons name={isBuffering ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'} size={34} color="#111111" />
          </TouchableOpacity>
          <TouchableOpacity onPress={next} hitSlop={12} disabled={controlsLoading}>
            <Ionicons name="play-skip-forward" size={36} color={colors.text} />
          </TouchableOpacity>
          <Ionicons name="repeat" size={22} color={colors.textMuted} />
        </View>

        <View style={styles.footerTools}>
          <TouchableOpacity
            onPress={() =>
              currentTrack.sourceId
                ? router.push({ pathname: '/playlists/pick', params: { trackId: String(currentTrack.sourceId), trackTitle: currentTrack.title } })
                : undefined
            }
          >
            <Ionicons name="list-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <Ionicons name="share-social-outline" size={20} color={colors.textMuted} />
        </View>

        <View style={styles.queueSection}>
          <Text style={styles.queueTitle}>Up Next</Text>
          {upcomingQueue.length === 0 ? (
            <Text style={styles.queueEmpty}>No additional tracks in the queue yet.</Text>
          ) : (
            upcomingQueue.map((track, index) => (
              <View key={`${track.id}-${index}`} style={styles.queueRow}>
                <LinearGradient colors={track.palette} style={styles.queueArtwork} />
                <View style={styles.queueMeta}>
                  <Text style={styles.queueTrackTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.queueTrackSubtitle} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>
                {track.playbackSource === 'offline' ? <Text style={styles.queueBadge}>Offline</Text> : null}
              </View>
            ))
          )}
        </View>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  hero: {
    minHeight: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 160,
    gap: 28,
  },
  artwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    marginTop: 12,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  artist: {
    color: '#d1d5db',
    fontSize: 16,
    marginTop: 6,
  },
  offlineLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressBlock: {
    gap: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '700',
  },
  seekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  seekLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  seekHint: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 18,
  },
  bufferingLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  errorLabel: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTools: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  queueSection: {
    gap: 12,
  },
  queueTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  queueEmpty: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  queueArtwork: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  queueMeta: {
    flex: 1,
    gap: 4,
  },
  queueTrackTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  queueTrackSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  queueBadge: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  empty: {
    color: colors.text,
    fontSize: 16,
  },
});
