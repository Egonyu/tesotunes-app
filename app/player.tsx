import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePlayerControls, usePlayerQueueSync, useQueueManagement } from '../src/hooks/use-player-queue';
import { useTrackLikeStatus, useToggleTrackLike } from '../src/hooks/use-track-likes';
import { Screen } from '../src/components/screen';
import { ArtworkImage } from '../src/components/artwork-image';
import { colors } from '../src/theme/colors';
import { usePlayerStore } from '../src/store/player-store';

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function StatusChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'danger';
}) {
  return (
    <View
      style={[
        styles.statusChip,
        tone === 'accent' ? styles.statusChipAccent : null,
        tone === 'danger' ? styles.statusChipDanger : null,
      ]}
    >
      <Text
        style={[
          styles.statusChipLabel,
          tone === 'accent' ? styles.statusChipLabelAccent : null,
          tone === 'danger' ? styles.statusChipLabelDanger : null,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PlayerScreen() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const queue = usePlayerStore((state) => state.queue);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const durationSeconds = usePlayerStore((state) => state.durationSeconds);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const playbackError = usePlayerStore((state) => state.playbackError);
  const { togglePlayback, next, previous, seekTo, controlsLoading } = usePlayerControls();
  const queueQuery = usePlayerQueueSync();
  const { clearQueue, shuffleQueue, removeFromQueue, reorderQueue, queueActionLoading } = useQueueManagement();
  const likeStatus = useTrackLikeStatus(currentTrack ?? undefined);
  const toggleLike = useToggleTrackLike(currentTrack ?? undefined);

  if (!currentTrack) {
    return (
      <Screen>
        <Text style={styles.empty}>No active track.</Text>
      </Screen>
    );
  }

  const activeTrack = currentTrack;

  const queueItems = queueQuery.data?.queueItems ?? queue;
  const upcomingQueue = queueItems.filter((track) => track.id !== activeTrack.id);
  const totalQueueTracks = queueItems.length;
  const remainingDurationSeconds = queueQuery.data?.remainingDurationSeconds ?? 0;
  const queueSummary = `${totalQueueTracks} tracks • ${upcomingQueue.length} up next`;
  const queueSyncLabel = queueQuery.isLoading
    ? 'Syncing queue'
    : queueQuery.data
      ? 'Queue synced'
      : 'Local queue';
  const playbackModeLabel = activeTrack.playbackSource === 'offline' ? 'Offline source' : 'Streaming source';

  async function moveQueueItem(trackId: string, direction: -1 | 1) {
    const ordered = [...upcomingQueue];
    const index = ordered.findIndex((track) => track.id === trackId);

    if (index === -1) {
      return;
    }

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= ordered.length) {
      return;
    }

    const reordered = [...ordered];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);

    const payload = reordered
      .filter((track) => typeof track.queueItemId === 'number')
      .map((track, itemIndex) => ({
        id: track.queueItemId!,
        position: itemIndex + 2,
      }));

    if (typeof activeTrack.queueItemId === 'number') {
      payload.unshift({ id: activeTrack.queueItemId, position: 1 });
    }

    if (payload.length > 0) {
      await reorderQueue.mutateAsync(payload);
    }
  }

  async function playQueueItemNow(trackId: string) {
    const ordered = [...upcomingQueue];
    const index = ordered.findIndex((track) => track.id === trackId);

    if (index === -1) {
      return;
    }

    const target = ordered[index];
    if (typeof target.queueItemId !== 'number') {
      return;
    }

    const reordered = [...ordered];
    const [selected] = reordered.splice(index, 1);
    reordered.unshift(selected);

    const payload = reordered
      .filter((track) => typeof track.queueItemId === 'number')
      .map((track, itemIndex) => ({
        id: track.queueItemId!,
        position: itemIndex + 2,
      }));

    if (typeof activeTrack.queueItemId === 'number') {
      payload.unshift({ id: activeTrack.queueItemId, position: 1 });
    }

    if (payload.length > 0) {
      await reorderQueue.mutateAsync(payload);
      next();
    }
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <LinearGradient colors={[currentTrack.palette[0], currentTrack.palette[1], '#090909']} style={styles.hero}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarButton} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.topBarMeta}>
            <Text style={styles.topBarEyebrow}>Now Playing</Text>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {activeTrack.albumTitle || 'TesoTunes Player'}
            </Text>
          </View>
          <TouchableOpacity style={styles.topBarButton} onPress={() => router.push('/more')}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ArtworkImage uri={currentTrack.artworkUrl} palette={currentTrack.palette} style={styles.artwork} />
        <View style={styles.meta}>
          <View>
            <Text style={styles.title}>{currentTrack.title}</Text>
            <Text style={styles.artist}>{currentTrack.artist}</Text>
            {currentTrack.playbackSource === 'offline' ? <Text style={styles.offlineLabel}>Playing from downloads</Text> : null}
          </View>
          <TouchableOpacity onPress={() => toggleLike.mutate()} disabled={!currentTrack.sourceId}>
            <Ionicons name={likeStatus.data ? 'heart' : 'heart-outline'} size={24} color={likeStatus.data ? colors.accent : colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
          <StatusChip label={playbackModeLabel} tone={activeTrack.playbackSource === 'offline' ? 'accent' : 'neutral'} />
          <StatusChip label={isBuffering ? 'Buffering' : isPlaying ? 'Playing' : 'Paused'} tone={isBuffering ? 'accent' : 'neutral'} />
          <StatusChip label={queueSyncLabel} tone={queueQuery.data ? 'accent' : 'neutral'} />
          {playbackError ? <StatusChip label="Action needed" tone="danger" /> : null}
        </View>

        <View style={styles.progressBlock}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={durationSeconds > 0 ? durationSeconds : 1}
            value={Math.min(currentTime, durationSeconds > 0 ? durationSeconds : 1)}
            minimumTrackTintColor={colors.text}
            maximumTrackTintColor="rgba(255,255,255,0.22)"
            thumbTintColor={colors.text}
            disabled={controlsLoading || durationSeconds <= 0}
            onSlidingComplete={(value) => seekTo(value)}
          />
          <View style={styles.progressMeta}>
            <Text style={styles.progressLabel}>{formatTime(currentTime)}</Text>
            <Text style={styles.progressLabel}>{durationSeconds > 0 ? formatTime(durationSeconds) : currentTrack.duration}</Text>
          </View>
        </View>

        {playbackError ? <Text style={styles.errorLabel}>{playbackError}</Text> : null}
        {isBuffering ? <Text style={styles.bufferingLabel}>Buffering audio...</Text> : null}

        {durationSeconds > 0 ? <Text style={styles.seekHint}>Drag the slider to move through the song.</Text> : null}

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.sideControl, styles.sideControlMuted]} onPress={() => shuffleQueue.mutate()} disabled={queueActionLoading || totalQueueTracks <= 2}>
            <Ionicons name="shuffle" size={20} color={totalQueueTracks > 2 ? colors.text : colors.textSubtle} />
          </TouchableOpacity>
          <TouchableOpacity onPress={previous} hitSlop={12} disabled={controlsLoading} style={styles.sideControl}>
            <Ionicons name="play-skip-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlayback} style={styles.playButton} hitSlop={12}>
            <Ionicons name={isBuffering ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'} size={34} color="#111111" />
          </TouchableOpacity>
          <TouchableOpacity onPress={next} hitSlop={12} disabled={controlsLoading} style={styles.sideControl}>
            <Ionicons name="play-skip-forward" size={28} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sideControl, styles.sideControlMuted]}
            onPress={() => clearQueue.mutate()}
            disabled={queueActionLoading || totalQueueTracks <= 1}
          >
            <Ionicons name="trash-outline" size={20} color={totalQueueTracks > 1 ? colors.text : colors.textSubtle} />
          </TouchableOpacity>
        </View>

        <View style={styles.transportHintRow}>
          <Text style={styles.transportHint}>Skip, shuffle, and queue actions are now managed directly from the player.</Text>
          <TouchableOpacity
            style={styles.queueManageButton}
            onPress={() =>
              currentTrack.sourceId
                ? router.push({ pathname: '/playlists/pick', params: { trackId: String(currentTrack.sourceId), trackTitle: currentTrack.title } })
                : undefined
            }
            disabled={!currentTrack.sourceId}
          >
            <Ionicons name="list-outline" size={16} color={currentTrack.sourceId ? colors.text : colors.textSubtle} />
            <Text style={[styles.queueManageLabel, !currentTrack.sourceId ? styles.queueManageLabelDisabled : null]}>Add to playlist</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.queueSection}>
          <View style={styles.queueHeader}>
            <View>
              <Text style={styles.queueTitle}>Up Next</Text>
              <Text style={styles.queueSummary}>
                {queueSummary}
                {remainingDurationSeconds > 0 ? ` • ${formatTime(remainingDurationSeconds)} left` : ''}
              </Text>
            </View>
            {queueQuery.isLoading || queueActionLoading ? <ActivityIndicator color={colors.textMuted} size="small" /> : null}
          </View>
          <View style={styles.nowPlayingCard}>
            <ArtworkImage uri={activeTrack.artworkUrl} palette={activeTrack.palette} style={styles.nowPlayingArtwork} />
            <View style={styles.nowPlayingMeta}>
              <Text style={styles.nowPlayingEyebrow}>Now Playing</Text>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                {activeTrack.title}
              </Text>
              <Text style={styles.nowPlayingSubtitle} numberOfLines={1}>
                {activeTrack.artist} • {durationSeconds > 0 ? formatTime(durationSeconds) : activeTrack.duration}
              </Text>
            </View>
            {activeTrack.playbackSource === 'offline' ? <Text style={styles.queueBadge}>Offline</Text> : null}
          </View>
          {upcomingQueue.length === 0 ? (
            <Text style={styles.queueEmpty}>No additional tracks in the queue yet.</Text>
          ) : (
            upcomingQueue.map((track, index) => (
              <View key={`${track.id}-${index}`} style={styles.queueRow}>
                <View style={styles.queueOrderBadge}>
                  <Text style={styles.queueOrderLabel}>{index + 1}</Text>
                </View>
                <ArtworkImage uri={track.artworkUrl} palette={track.palette} style={styles.queueArtwork} />
                <View style={styles.queueMeta}>
                  <Text style={styles.queueTrackTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.queueTrackSubtitle} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>
                {track.playbackSource === 'offline' ? <Text style={styles.queueBadge}>Offline</Text> : null}
                <View style={styles.queueActions}>
                  <TouchableOpacity
                    disabled={queueActionLoading || typeof track.queueItemId !== 'number'}
                    onPress={() => (typeof track.queueItemId === 'number' ? void playQueueItemNow(track.id) : undefined)}
                  >
                    <Ionicons name="play-circle-outline" size={20} color={typeof track.queueItemId === 'number' ? colors.text : colors.textSubtle} />
                  </TouchableOpacity>
                  <TouchableOpacity disabled={index === 0 || queueActionLoading} onPress={() => void moveQueueItem(track.id, -1)}>
                    <Ionicons name="arrow-up-outline" size={18} color={index === 0 ? colors.textSubtle : colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity disabled={index === upcomingQueue.length - 1 || queueActionLoading} onPress={() => void moveQueueItem(track.id, 1)}>
                    <Ionicons
                      name="arrow-down-outline"
                      size={18}
                      color={index === upcomingQueue.length - 1 ? colors.textSubtle : colors.textMuted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={queueActionLoading || typeof track.queueItemId !== 'number'}
                    onPress={() => (typeof track.queueItemId === 'number' ? removeFromQueue.mutate(track.queueItemId) : undefined)}
                  >
                    <Ionicons name="close-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topBarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarMeta: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  topBarEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  topBarTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
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
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusChipAccent: {
    backgroundColor: 'rgba(30,215,96,0.16)',
  },
  statusChipDanger: {
    backgroundColor: 'rgba(239,68,68,0.16)',
  },
  statusChipLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  statusChipLabelAccent: {
    color: colors.accent,
  },
  statusChipLabelDanger: {
    color: '#fda4af',
  },
  progressBlock: {
    gap: 4,
  },
  slider: {
    width: '100%',
    height: 28,
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
  sideControl: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideControlMuted: {
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportHintRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  transportHint: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  queueManageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  queueManageLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  queueManageLabelDisabled: {
    color: colors.textSubtle,
  },
  queueSection: {
    gap: 12,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queueTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  queueSummary: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  queueEmpty: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(8,8,8,0.22)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nowPlayingArtwork: {
    width: 54,
    height: 54,
    borderRadius: 12,
  },
  nowPlayingMeta: {
    flex: 1,
    gap: 4,
  },
  nowPlayingEyebrow: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  nowPlayingTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  nowPlayingSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  queueOrderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueOrderLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
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
  queueActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  empty: {
    color: colors.text,
    fontSize: 16,
  },
});
