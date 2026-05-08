import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { useCreditBalance, useCreditTransactions, usePurchaseCredits } from '../../src/hooks/use-wallet';
import { colors } from '../../src/theme/colors';

const CREDIT_PRESETS = [
  { credits: 50, ugx: 1250 },
  { credits: 100, ugx: 2500 },
  { credits: 250, ugx: 6250 },
  { credits: 500, ugx: 12500 },
  { credits: 1000, ugx: 25000 },
];

function formatUgx(n: number) {
  return `UGX ${Math.floor(n).toLocaleString()}`;
}

export default function CreditsScreen() {
  const [selected, setSelected] = useState(CREDIT_PRESETS[1]);
  const [customUgx, setCustomUgx] = useState('');

  const { data: creditData, isLoading, refetch } = useCreditBalance();
  const { data: txData } = useCreditTransactions(1);
  const purchaseCredits = usePurchaseCredits();

  const creditsBalance = creditData?.credits_balance ?? 0;
  const ugxBalance = creditData?.ugx_balance ?? 0;
  const exchangeRate = creditData?.exchange_rate ?? 25;

  const finalUgx = customUgx ? parseInt(customUgx, 10) || 0 : selected.ugx;
  const finalCredits = customUgx ? Math.floor(parseInt(customUgx, 10) / exchangeRate * exchangeRate / exchangeRate) || 0 : selected.credits;
  const canAfford = ugxBalance >= finalUgx;
  const recentTx = txData?.data?.slice(0, 5) ?? [];

  async function handleBuy() {
    if (!canAfford) {
      Alert.alert('Insufficient balance', 'Top up your wallet first.', [
        { text: 'Top Up', onPress: () => router.push('/wallet/topup' as never) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    try {
      await purchaseCredits.mutateAsync(finalUgx);
      await refetch();
    } catch (err) {
      Alert.alert('Purchase failed', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Credits</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <>
            <View style={styles.balanceCard}>
              <Ionicons name="star" size={24} color={colors.accent} />
              <Text style={styles.balanceAmount}>{creditsBalance.toLocaleString()}</Text>
              <Text style={styles.balanceLabel}>credits</Text>
              <Text style={styles.walletHint}>Wallet: {formatUgx(ugxBalance)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Buy credits</Text>
              <Text style={styles.sectionHint}>1 credit = {formatUgx(exchangeRate)} UGX · deducted from wallet</Text>
              <View style={styles.presetGrid}>
                {CREDIT_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.credits}
                    style={[styles.presetCard, !customUgx && selected.credits === preset.credits && styles.presetCardActive]}
                    onPress={() => { setSelected(preset); setCustomUgx(''); }}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.presetCredits, !customUgx && selected.credits === preset.credits && styles.presetCreditsActive]}>
                      {preset.credits}
                    </Text>
                    <Text style={[styles.presetUnit, !customUgx && selected.credits === preset.credits && styles.presetUnitActive]}>credits</Text>
                    <Text style={[styles.presetUgx, !customUgx && selected.credits === preset.credits && styles.presetUgxActive]}>
                      {formatUgx(preset.ugx)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Or enter UGX amount"
                placeholderTextColor={colors.textSubtle}
                value={customUgx}
                onChangeText={setCustomUgx}
                keyboardType="numeric"
              />
            </View>

            {!canAfford && finalUgx > 0 ? (
              <View style={styles.warningRow}>
                <Ionicons name="warning-outline" size={14} color="#facc15" />
                <Text style={styles.warningText}>
                  Wallet balance is too low.{' '}
                  <Text style={styles.warningLink} onPress={() => router.push('/wallet/topup' as never)}>Top up now</Text>
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, (!canAfford || purchaseCredits.isPending) && styles.primaryButtonDisabled]}
              onPress={handleBuy}
              disabled={purchaseCredits.isPending || finalUgx <= 0}
              activeOpacity={0.88}
            >
              {purchaseCredits.isPending ? (
                <ActivityIndicator color="#07110d" />
              ) : (
                <>
                  <Ionicons name="star" size={16} color="#07110d" />
                  <Text style={styles.primaryButtonLabel}>
                    Buy {customUgx ? `~${finalCredits}` : selected.credits} credits for {formatUgx(finalUgx)}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {recentTx.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Recent activity</Text>
                <View style={styles.txList}>
                  {recentTx.map((tx) => (
                    <View key={tx.id} style={styles.txRow}>
                      <View style={styles.txIconWrap}>
                        <Ionicons
                          name={tx.type === 'EARNED' ? 'arrow-down-outline' : 'arrow-up-outline'}
                          size={14}
                          color={tx.type === 'EARNED' ? colors.accent : colors.danger}
                        />
                      </View>
                      <View style={styles.txMeta}>
                        <Text style={styles.txDesc} numberOfLines={1}>{tx.description ?? tx.source}</Text>
                        <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                      </View>
                      <Text style={[styles.txAmount, { color: tx.type === 'EARNED' ? colors.accent : colors.danger }]}>
                        {tx.type === 'EARNED' ? '+' : '-'}{tx.amount}
                      </Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity onPress={() => router.push('/wallet/transactions' as never)}>
                  <Text style={styles.viewAllLink}>View full history →</Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceAmount: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '900',
    marginTop: 4,
  },
  balanceLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  walletHint: {
    color: colors.textSubtle,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: -4,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetCard: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
  },
  presetCardActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  presetCredits: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  presetCreditsActive: {
    color: '#07110d',
  },
  presetUnit: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  presetUnitActive: {
    color: 'rgba(7,17,13,0.7)',
  },
  presetUgx: {
    color: colors.textSubtle,
    fontSize: 10,
    marginTop: 2,
  },
  presetUgxActive: {
    color: 'rgba(7,17,13,0.6)',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 14,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(250,204,21,0.08)',
    borderRadius: 8,
    padding: 10,
  },
  warningText: {
    color: '#facc15',
    fontSize: 12,
    flex: 1,
  },
  warningLink: {
    textDecorationLine: 'underline',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 15,
  },
  primaryButtonDisabled: {
    opacity: 0.38,
  },
  primaryButtonLabel: {
    color: '#07110d',
    fontSize: 15,
    fontWeight: '900',
  },
  txList: {
    gap: 10,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMeta: {
    flex: 1,
    gap: 2,
  },
  txDesc: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  txDate: {
    color: colors.textSubtle,
    fontSize: 11,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  viewAllLink: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
