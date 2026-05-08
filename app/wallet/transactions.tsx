import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { StateMessage } from '../../src/components/state-message';
import { useCreditTransactions, useWalletTransactions } from '../../src/hooks/use-wallet';
import { colors } from '../../src/theme/colors';

type Tab = 'payments' | 'credits';

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  wallet_topup: 'Wallet top-up',
  credits_purchase: 'Credits bought',
  credits_sale: 'Credits cashed out',
  tip: 'Artist tip',
  purchase: 'Song purchase',
  subscription: 'Subscription',
  withdrawal: 'Withdrawal',
  ticket_purchase: 'Event ticket',
};

const CREDIT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  EARNED: 'arrow-down-outline',
  SPENT: 'arrow-up-outline',
  BONUS: 'gift-outline',
};

function statusColor(status: string) {
  if (status === 'completed') return colors.accent;
  if (status === 'failed' || status === 'cancelled') return colors.danger;
  return '#facc15';
}

function formatUgx(n: number) {
  return `UGX ${Math.floor(n).toLocaleString()}`;
}

export default function TransactionsScreen() {
  const [tab, setTab] = useState<Tab>('payments');
  const { data: paymentData, isLoading: paymentsLoading } = useWalletTransactions(1);
  const { data: creditData, isLoading: creditsLoading } = useCreditTransactions(1);

  const payments = paymentData?.data ?? [];
  const credits = creditData?.data ?? [];
  const isLoading = tab === 'payments' ? paymentsLoading : creditsLoading;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'payments' && styles.tabActive]}
            onPress={() => setTab('payments')}
            activeOpacity={0.82}
          >
            <Text style={[styles.tabLabel, tab === 'payments' && styles.tabLabelActive]}>Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'credits' && styles.tabActive]}
            onPress={() => setTab('credits')}
            activeOpacity={0.82}
          >
            <Text style={[styles.tabLabel, tab === 'credits' && styles.tabLabelActive]}>Credits</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : tab === 'payments' ? (
          payments.length === 0 ? (
            <StateMessage
              compact
              title="No transactions yet"
              body="Your payment history will appear here after your first top-up or purchase."
              actionLabel="Top up wallet"
              onActionPress={() => router.push('/wallet/topup' as never)}
            />
          ) : (
            <View style={styles.list}>
              {payments.map((tx) => (
                <View key={tx.id} style={styles.txCard}>
                  <View style={styles.txIconWrap}>
                    <Ionicons
                      name={tx.payment_type === 'withdrawal' ? 'arrow-up-outline' : 'arrow-down-outline'}
                      size={16}
                      color={tx.payment_type === 'withdrawal' ? colors.danger : colors.accent}
                    />
                  </View>
                  <View style={styles.txMeta}>
                    <Text style={styles.txTitle}>
                      {PAYMENT_TYPE_LABELS[tx.payment_type] ?? tx.payment_type}
                    </Text>
                    {tx.description ? (
                      <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                    ) : null}
                    <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>{formatUgx(tx.amount)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${statusColor(tx.status)}18` }]}>
                      <Text style={[styles.statusLabel, { color: statusColor(tx.status) }]}>{tx.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : credits.length === 0 ? (
          <StateMessage
            compact
            title="No credit activity yet"
            body="Your credit earnings and spending will show up here."
            actionLabel="Get credits"
            onActionPress={() => router.push('/wallet/credits' as never)}
          />
        ) : (
          <View style={styles.list}>
            {credits.map((tx) => (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txIconWrap}>
                  <Ionicons
                    name={CREDIT_TYPE_ICONS[tx.type] ?? 'swap-horizontal-outline'}
                    size={16}
                    color={tx.type === 'EARNED' || tx.type === 'BONUS' ? colors.accent : colors.danger}
                  />
                </View>
                <View style={styles.txMeta}>
                  <Text style={styles.txTitle}>{tx.description ?? tx.source}</Text>
                  <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: tx.type === 'EARNED' || tx.type === 'BONUS' ? colors.accent : colors.danger }]}>
                    {tx.type === 'EARNED' || tx.type === 'BONUS' ? '+' : '-'}{tx.amount}
                  </Text>
                  <Text style={styles.balanceAfter}>bal: {tx.balance_after}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: '800',
  },
  loadingBlock: {
    paddingTop: 40,
    alignItems: 'center',
  },
  list: {
    gap: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMeta: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  txDesc: {
    color: colors.textMuted,
    fontSize: 12,
  },
  txDate: {
    color: colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  balanceAfter: {
    color: colors.textSubtle,
    fontSize: 11,
  },
});
