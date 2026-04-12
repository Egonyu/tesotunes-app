import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../theme/colors';

export function StateMessage({
  title,
  body,
  compact = false,
  actionLabel,
  onActionPress,
}: {
  title: string;
  body: string;
  compact?: boolean;
  actionLabel?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={[styles.card, compact ? styles.compactCard : null]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onActionPress ? (
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.85} onPress={onActionPress}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 6,
  },
  compactCard: {
    paddingVertical: 14,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
});
