import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { StateMessage } from '../../src/components/state-message';
import { useCreditBalance, useWalletBalance } from '../../src/hooks/use-wallet';
import { useAuthStore } from '../../src/store/auth-store';
import { colors } from '../../src/theme/colors';

function formatUgx(amount: number) {
  return `UGX ${Math.floor(amount).toLocaleString()}`;
}

type ActionTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
  accent?: boolean;
};

function ActionTile({ icon, label, subtitle, onPress, accent }: ActionTileProps) {
  return (
    <TouchableOpacity style={[styles.actionTile, accent && styles.actionTileAccent]} onPress={onPress} activeOpacity={0.86}>
      <View style={[styles.actionIcon, accent && styles.actionIconAccent]}>
        <Ionicons name={icon} size={20} color={accent ? '#07110d' : colors.text} />
      </View>
      <Text style={[styles.actionLabel, accent && styles.actionLabelAccent]}>{label}</Text>
      <Text style={[styles.actionSubtitle, accent && styles.actionSubtitleAccent]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function WalletScreen() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useWalletBalance();
  const { data: creditData, isLoading: creditLoading, refetch: refetchCredits } = useCreditBalance();

  const isLoading = walletLoading || creditLoading;

  async function handleRefresh() {
    await Promise.all([refetchWallet(), refetchCredits()]);
  }

  if (!isAuthenticated) {
    return (
      <Screen>
        <StateMessage
          title="Sign in to access your wallet"
          body="Your UGX balance, credits, and transaction history are available after signing in."
          actionLabel="Sign In"
          onActionPress={() => router.push('/sign-in' as never)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={colors.accent} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceEyebrow}>UGX Balance</Text>
              {walletData ? (
                <Text style={styles.balanceAmount}>{formatUgx(walletData.ugx_balance)}</Text>
              ) : (
                <Text style={styles.balanceAmount}>—</Text>
              )}
              <View style={styles.creditsBadge}>
                <Ionicons name="star" size={13} color={colors.accent} />
                <Text style={styles.creditsBadgeLabel}>
                  {creditData ? creditData.credits_balance.toLocaleString() : '—'} credits
                </Text>
              </View>
            </View>

            <View style={styles.actionsGrid}>
              <ActionTile
                icon="add-circle-outline"
                label="Top Up"
                subtitle="Add UGX via mobile money"
                onPress={() => router.push('/wallet/topup' as never)}
                accent
              />
              <ActionTile
                icon="star-outline"
                label="Credits"
                subtitle="Buy or manage credits"
                onPress={() => router.push('/wallet/credits' as never)}
              />
              <ActionTile
                icon="time-outline"
                label="History"
                subtitle="View all transactions"
                onPress={() => router.push('/wallet/transactions' as never)}
              />
              <ActionTile
                icon="arrow-up-circle-outline"
                label="Withdraw"
                subtitle="Cash out to mobile money"
                onPress={() => router.push('/wallet/withdraw' as never)}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What you can do</Text>
              <View style={styles.infoList}>
                {[
                  { icon: 'musical-note-outline' as const, text: 'Purchase songs and albums for offline listening' },
                  { icon: 'heart-outline' as const, text: 'Tip your favourite artists with credits' },
                  { icon: 'star-outline' as const, text: 'Use credits for exclusive content and promotions' },
                  { icon: 'wifi-outline' as const, text: 'Top up via MTN MoMo or Airtel Money' },
                ].map((item) => (
                  <View key={item.text} style={styles.infoRow}>
                    <Ionicons name={item.icon} size={16} color={colors.accent} />
                    <Text style={styles.infoText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  loadingBlock: {
    paddingTop: 60,
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: 24,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceEyebrow: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '900',
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30,215,96,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  creditsBadgeLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionTile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  actionTileAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconAccent: {
    backgroundColor: 'rgba(7,17,13,0.14)',
  },
  actionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  actionLabelAccent: {
    color: '#07110d',
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  actionSubtitleAccent: {
    color: 'rgba(7,17,13,0.72)',
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
