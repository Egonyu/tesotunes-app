import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../src/components/screen';
import { SubscriptionPlan, useSubscribe, useSubscriptionPlans } from '../src/hooks/use-subscription';
import { useAuthStore } from '../src/store/auth-store';
import { colors } from '../src/theme/colors';

function PlanCard({ plan, onSelect, isLoading }: { plan: SubscriptionPlan; onSelect: () => void; isLoading: boolean }) {
  return (
    <View style={[styles.card, plan.isCurrent && styles.cardCurrent, plan.isPopular && styles.cardPopular]}>
      {plan.isPopular ? (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeLabel}>Most Popular</Text>
        </View>
      ) : null}

      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.planName, plan.isPopular && styles.planNamePopular]}>{plan.name}</Text>
          <Text style={[styles.planPrice, plan.isPopular && styles.planPricePopular]}>{plan.priceLabel}</Text>
        </View>
        {plan.isCurrent ? (
          <View style={styles.currentBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
            <Text style={styles.currentBadgeLabel}>Active</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.featureList}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark" size={14} color={plan.isPopular ? colors.accent : colors.textMuted} />
            <Text style={[styles.featureLabel, plan.isPopular && styles.featureLabelPopular]}>{feature}</Text>
          </View>
        ))}
      </View>

      {!plan.isCurrent ? (
        <TouchableOpacity
          style={[styles.selectButton, plan.isPopular && styles.selectButtonPopular, isLoading && styles.buttonDisabled]}
          onPress={onSelect}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color={plan.isPopular ? colors.background : colors.text} />
          ) : (
            <Text style={[styles.selectLabel, plan.isPopular && styles.selectLabelPopular]}>
              {plan.priceUgx === 0 ? 'Use free plan' : `Subscribe — ${plan.priceLabel}`}
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.currentPlanFooter}>
          <Text style={styles.currentPlanFooterLabel}>Your current plan</Text>
        </View>
      )}
    </View>
  );
}

export default function SubscriptionScreen() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const { data: plans = [], isLoading } = useSubscriptionPlans();
  const subscribe = useSubscribe();

  async function handleSelect(plan: SubscriptionPlan) {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    await subscribe.mutateAsync(plan.id);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TesoTunes</Text>
        <Text style={styles.title}>Choose your plan</Text>
        <Text style={styles.subtitle}>
          Upgrade to unlock high-quality audio, unlimited downloads, and more. Paid via your TesoTunes wallet.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <View style={styles.planList}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={() => void handleSelect(plan)}
              isLoading={subscribe.isPending && subscribe.variables === plan.id}
            />
          ))}
        </View>
      )}

      {subscribe.error ? (
        <Text style={styles.error}>{subscribe.error instanceof Error ? subscribe.error.message : 'Subscription failed. Please try again.'}</Text>
      ) : null}

      <View style={styles.footer}>
        <Ionicons name="wallet-outline" size={15} color={colors.textSubtle} />
        <Text style={styles.footerNote}>Payments are deducted from your TesoTunes UGX wallet balance.</Text>
      </View>

      <TouchableOpacity style={styles.walletLink} onPress={() => router.push('/wallet' as never)}>
        <Text style={styles.walletLinkLabel}>Check wallet balance</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.accent} />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  planList: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCurrent: {
    borderColor: 'rgba(30,215,96,0.3)',
  },
  cardPopular: {
    backgroundColor: '#0d1e12',
    borderColor: 'rgba(30,215,96,0.5)',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  popularBadgeLabel: {
    color: '#07110d',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  planName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  planNamePopular: {
    color: colors.accent,
  },
  planPrice: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  planPricePopular: {
    color: colors.text,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30,215,96,0.1)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currentBadgeLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureLabel: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  featureLabelPopular: {
    color: colors.text,
  },
  selectButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 14,
    minHeight: 50,
  },
  selectButtonPopular: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  selectLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  selectLabelPopular: {
    color: '#07110d',
  },
  currentPlanFooter: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  currentPlanFooterLabel: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerNote: {
    color: colors.textSubtle,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  walletLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  walletLinkLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
