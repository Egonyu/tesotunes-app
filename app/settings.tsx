import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../src/components/screen';
import { AudioQuality, useSettingsStore } from '../src/store/settings-store';
import { colors } from '../src/theme/colors';

const QUALITY_OPTIONS: { value: AudioQuality; label: string; description: string }[] = [
  { value: 'low', label: 'Low (64 kbps)', description: 'Saves data, best for slow connections' },
  { value: 'normal', label: 'Normal (128 kbps)', description: 'Balanced quality and data usage' },
  { value: 'high', label: 'High (320 kbps)', description: 'Best quality — Premium plan recommended' },
];

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function ActionRow({ icon, title, subtitle, onPress, iconColor }: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.actionLeft}>
        <Ionicons name={icon as never} size={18} color={iconColor ?? colors.text} />
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const audioQuality = useSettingsStore((state) => state.audioQuality);
  const setAudioQuality = useSettingsStore((state) => state.setAudioQuality);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage audio quality, security, and app preferences.</Text>
      </View>

      <View style={styles.section}>
        <SectionTitle>Audio Quality</SectionTitle>
        <Text style={styles.sectionNote}>
          Applies to streaming and downloads. High quality requires more data and storage.
        </Text>
        <View style={styles.qualityGroup}>
          {QUALITY_OPTIONS.map((option) => {
            const isSelected = audioQuality === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.qualityRow, isSelected && styles.qualityRowSelected]}
                onPress={() => setAudioQuality(option.value)}
                activeOpacity={0.82}
              >
                <View style={styles.qualityMeta}>
                  <Text style={[styles.qualityLabel, isSelected && styles.qualityLabelSelected]}>{option.label}</Text>
                  <Text style={styles.qualityDescription}>{option.description}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle>Account Security</SectionTitle>
        <ActionRow
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Send a reset link to your registered email"
          onPress={() => router.push('/forgot-password')}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle>Subscription</SectionTitle>
        <ActionRow
          icon="diamond-outline"
          title="Manage Plan"
          subtitle="View and change your subscription tier"
          onPress={() => router.push('/subscription' as never)}
          iconColor={colors.accent}
        />
        <ActionRow
          icon="wallet-outline"
          title="Wallet & Credits"
          subtitle="Check balance, top up, or withdraw funds"
          onPress={() => router.push('/wallet' as never)}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle>About</SectionTitle>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Region</Text>
          <Text style={styles.infoValue}>Uganda (UGX)</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionNote: {
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  qualityGroup: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  qualityRowSelected: {
    backgroundColor: 'rgba(30,215,96,0.06)',
  },
  qualityMeta: {
    flex: 1,
    gap: 3,
  },
  qualityLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  qualityLabelSelected: {
    color: colors.accent,
  },
  qualityDescription: {
    color: colors.textMuted,
    fontSize: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    gap: 3,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
