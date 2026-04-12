import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { ArtworkPalette } from '../types/music';
import { resolveMediaUrl } from '../services/media/url';

export function ArtworkImage({
  uri,
  palette,
  style,
  contentFit = 'cover',
}: {
  uri?: string | null;
  palette: ArtworkPalette;
  style: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}) {
  const resolvedUri = resolveMediaUrl(uri);

  return (
    <View style={[style, styles.shell]}>
      <LinearGradient colors={palette} style={StyleSheet.absoluteFillObject} />
      {resolvedUri ? (
        <Image
          source={{ uri: resolvedUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit={contentFit}
          transition={180}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    backgroundColor: '#161616',
  },
});
