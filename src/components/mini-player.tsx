import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerControls } from '../hooks/use-player-queue';
import { colors } from '../theme/colors';
import { usePlayerStore } from '../store/player-store';

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const { togglePlayback, next } = usePlayerControls();

  if (!currentTrack) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + 62 }]}>
      <Pressable onPress={() => router.push('/player')}>
        <BlurView intensity={28} tint="dark" style={styles.playerShell}>
          <LinearGradient colors={currentTrack.palette} style={styles.artwork} />
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
              {currentTrack.playbackSource === 'offline' ? <Text style={styles.offlineBadge}>Offline</Text> : null}
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
    left: 12,
    right: 12,
  },
  playerShell: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(40, 16, 12, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: '#e7d7d2',
    fontSize: 12,
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
});
