import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerControls } from '../hooks/use-player-queue';
import { colors } from '../theme/colors';
import { usePlayerStore } from '../store/player-store';
import { ArtworkImage } from './artwork-image';

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const playbackError = usePlayerStore((state) => state.playbackError);
  const { togglePlayback, next } = usePlayerControls();

  if (!currentTrack) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + 78 }]}>
      <Pressable onPress={() => router.push('/player')}>
        <BlurView intensity={28} tint="dark" style={styles.playerShell}>
          <ArtworkImage uri={currentTrack.artworkUrl} palette={currentTrack.palette} style={styles.artwork} />
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle} numberOfLines={1}>
                {playbackError ? playbackError : currentTrack.artist}
              </Text>
              {currentTrack.playbackSource === 'offline' ? <Text style={styles.offlineBadge}>Offline</Text> : null}
              {isBuffering ? <Text style={styles.bufferingBadge}>Buffering</Text> : null}
            </View>
          </View>
          <TouchableOpacity onPress={togglePlayback} hitSlop={10}>
            <Ionicons name={isBuffering ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'} size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={next} hitSlop={10}>
            <Ionicons name="play-skip-forward" size={22} color={colors.text} />
          </TouchableOpacity>
        </BlurView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 70,
    right: 14,
  },
  playerShell: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  artwork: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    flexShrink: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineBadge: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bufferingBadge: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
