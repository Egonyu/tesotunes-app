import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useDownloadTrack, usePauseDownload } from '../hooks/use-downloads';
import { useTrackLikeStatus, useToggleTrackLike } from '../hooks/use-track-likes';
import { useAddToQueue } from '../hooks/use-player-queue';
import { resolveQueuePlayback, resolveTrackPlayback } from '../services/downloads/playback';
import { useAuthStore } from '../store/auth-store';
import { useDownloadStore } from '../store/download-store';
import { Album, Artist, Chart, EventItem, Genre, Track } from '../types/music';
import { colors } from '../theme/colors';
import { usePlayerStore } from '../store/player-store';
import { ArtworkImage } from './artwork-image';

export function SectionHeader({
  title,
  action,
  onActionPress,
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        onActionPress ? (
          <TouchableOpacity onPress={onActionPress} hitSlop={10}>
            <Text style={styles.sectionAction}>{action}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.sectionAction}>{action}</Text>
        )
      ) : null}
    </View>
  );
}

export function MixTile({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.mixTile} onPress={onPress}>
      <View style={styles.mixThumb} />
      <Text style={styles.mixLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AlbumCard({ album }: { album: Album }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={() => router.push(`/album/${album.id}`)}>
      <ArtworkImage uri={album.artworkUrl} palette={album.palette} style={styles.coverArt} />
      <Text style={styles.cardTitle} numberOfLines={2}>
        {album.title}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={2}>
        Album • {album.artist}
      </Text>
    </TouchableOpacity>
  );
}

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={() => router.push(`/artist/${artist.id}`)}>
      <ArtworkImage uri={artist.artworkUrl} palette={artist.palette} style={styles.artistArt} />
      <Text style={styles.cardTitle} numberOfLines={1}>
        {artist.name}
      </Text>
      <Text style={styles.cardMeta}>Artist</Text>
    </TouchableOpacity>
  );
}

export function TrackRow({ track, queue }: { track: Track; queue: Track[] }) {
  const playTrack = usePlayerStore((state) => state.playTrack);
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const addToQueue = useAddToQueue();
  const downloadTrack = useDownloadTrack();
  const pauseDownload = usePauseDownload();
  const downloads = useDownloadStore((state) => state.downloads);
  const likeStatus = useTrackLikeStatus(track);
  const toggleLike = useToggleTrackLike(track);
  const canQueue = isAuthenticated && typeof track.sourceId === 'number';
  const canDownload = isAuthenticated && typeof track.sourceId === 'number';
  const canLike = isAuthenticated && typeof track.sourceId === 'number';
  const downloadRecord = downloads.find((item) =>
    typeof track.sourceId === 'number' && typeof item.track.sourceId === 'number'
      ? item.track.sourceId === track.sourceId
      : item.track.id === track.id
  );
  const isDownloaded = downloadRecord?.status === 'completed';
  const isDownloading = downloadRecord?.status === 'downloading';
  const canResumeDownload = downloadRecord?.status === 'paused' || downloadRecord?.status === 'failed';
  const resolvedTrack = resolveTrackPlayback(track, downloads);
  const resolvedQueue = resolveQueuePlayback(queue, downloads);

  async function handleDownloadPress() {
    if (isDownloading && downloadRecord) {
      await pauseDownload.mutateAsync(downloadRecord);
      return;
    }

    await downloadTrack.mutateAsync(track);
  }

  function downloadIconName() {
    if (isDownloading) {
      return 'pause-circle-outline';
    }

    if (isDownloaded) {
      return 'checkmark-circle';
    }

    if (canResumeDownload) {
      return 'refresh-circle-outline';
    }

    return 'download-outline';
  }

  function downloadIconColor() {
    if (isDownloaded) {
      return colors.accent;
    }

    if (downloadRecord?.status === 'failed') {
      return colors.danger;
    }

    if (isDownloading) {
      return colors.text;
    }

    return colors.textMuted;
  }

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.trackRow} onPress={() => playTrack(resolvedTrack, resolvedQueue)}>
      <ArtworkImage uri={track.artworkUrl} palette={track.palette} style={styles.trackArt} />
      <View style={styles.trackMeta}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <View style={styles.trackSubtitleRow}>
          <Text style={styles.trackSubtitle} numberOfLines={1}>
            {track.artist} • {track.plays}
          </Text>
          {isDownloaded ? <Text style={styles.offlineBadge}>Offline</Text> : null}
          {isDownloading ? <Text style={styles.pendingBadge}>{Math.round((downloadRecord?.progress ?? 0) * 100)}%</Text> : null}
          {downloadRecord?.status === 'failed' ? <Text style={styles.failedBadge}>Retry</Text> : null}
        </View>
      </View>
      <View style={styles.actions}>
        {canLike ? (
          <TouchableOpacity onPress={() => void toggleLike.mutateAsync()} hitSlop={10} style={styles.queueButton}>
            <Ionicons
              name={likeStatus.data ? 'heart' : 'heart-outline'}
              size={20}
              color={likeStatus.data ? colors.accent : colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
        {canQueue ? (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/playlists/pick', params: { trackId: String(track.sourceId), trackTitle: track.title } })}
            hitSlop={10}
            style={styles.queueButton}
          >
            <Ionicons name="list-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
        {canDownload ? (
          <TouchableOpacity
            onPress={() => void handleDownloadPress()}
            hitSlop={10}
            style={styles.queueButton}
          >
            <Ionicons
              name={downloadIconName()}
              size={20}
              color={downloadIconColor()}
            />
          </TouchableOpacity>
        ) : null}
        {canQueue ? (
          <TouchableOpacity
            onPress={() => void addToQueue.mutateAsync(track.sourceId!)}
            hitSlop={10}
            style={styles.queueButton}
          >
            <Ionicons
              name={addToQueue.isPending ? 'hourglass-outline' : 'add-circle-outline'}
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : (
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export function SearchTile({
  label,
  palette,
  subtitle,
  onPress,
}: {
  label: string;
  palette: [string, string];
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.searchTile} onPress={onPress}>
      <LinearGradient colors={palette} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.searchLabel}>{label}</Text>
      {subtitle ? <Text style={styles.searchSubtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

export function ChartCard({ chart, onPress }: { chart: Chart; onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      <ArtworkImage uri={chart.artworkUrl} palette={chart.palette} style={styles.coverArt} />
      <Text style={styles.cardTitle} numberOfLines={2}>
        {chart.title}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={2}>
        {chart.genre} • {chart.totalPlays}
      </Text>
    </TouchableOpacity>
  );
}

export function GenreCard({ genre, onPress }: { genre: Genre; onPress?: () => void }) {
  return <SearchTile label={genre.name} subtitle={`${genre.songCount} songs`} palette={genre.palette} onPress={onPress} />;
}

export function EventCard({ event }: { event: EventItem }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.eventCard}>
      <LinearGradient colors={event.palette} style={styles.eventBanner}>
        <Text style={styles.eventDate}>{event.dateLabel}</Text>
      </LinearGradient>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventMeta}>
        {event.venue} • {event.city}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionAction: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  mixTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 6,
    overflow: 'hidden',
  },
  mixThumb: {
    width: 56,
    height: 56,
    backgroundColor: '#3a3a3a',
  },
  mixLabel: {
    color: colors.text,
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    width: 150,
    gap: 10,
  },
  coverArt: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  artistArt: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackArt: {
    width: 52,
    height: 52,
    borderRadius: 6,
  },
  trackMeta: {
    flex: 1,
    gap: 4,
  },
  trackSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  trackSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    flexShrink: 1,
  },
  offlineBadge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pendingBadge: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  failedBadge: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueButton: {
    padding: 2,
  },
  searchTile: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 14,
  },
  searchLabel: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  searchSubtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  eventCard: {
    width: 220,
    gap: 10,
  },
  eventBanner: {
    height: 140,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'flex-end',
  },
  eventDate: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  eventTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  eventMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
