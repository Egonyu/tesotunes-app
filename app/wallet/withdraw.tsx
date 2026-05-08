import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { useRequestWithdrawal, useValidatePhone, useWalletBalance } from '../../src/hooks/use-wallet';
import { colors } from '../../src/theme/colors';

const MIN_WITHDRAWAL = 5000;

function formatUgx(n: number) {
  return `UGX ${Math.floor(n).toLocaleString()}`;
}

type Phase = 'entry' | 'success' | 'error';

export default function WithdrawScreen() {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<string | null>(null);
  const [providerError, setProviderError] = useState('');
  const [phase, setPhase] = useState<Phase>('entry');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: walletData } = useWalletBalance();
  const validatePhone = useValidatePhone();
  const withdraw = useRequestWithdrawal();

  const ugxBalance = walletData?.ugx_balance ?? 0;
  const parsedAmount = parseInt(amount, 10) || 0;
  const canWithdraw = provider && parsedAmount >= MIN_WITHDRAWAL && parsedAmount <= ugxBalance;

  async function handlePhoneBlur() {
    if (phone.length < 9) return;
    setProviderError('');
    setProvider(null);
    try {
      const res = await validatePhone.mutateAsync(phone);
      if (res.valid && res.provider) {
        setProvider(res.provider);
        if (res.normalized) setPhone(res.normalized);
      } else {
        setProviderError(res.message ?? 'Use an MTN or Airtel number.');
      }
    } catch {
      setProviderError('Could not validate phone number.');
    }
  }

  async function handleWithdraw() {
    try {
      const res = await withdraw.mutateAsync({ amount: parsedAmount, phone });
      if (res.success) {
        setPhase('success');
      } else {
        setErrorMsg(res.message ?? 'Withdrawal failed. Please try again.');
        setPhase('error');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setPhase('error');
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw</Text>
        </View>

        {phase === 'entry' && (
          <>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceEyebrow}>Available balance</Text>
              <Text style={styles.balanceAmount}>{formatUgx(ugxBalance)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Amount to withdraw</Text>
              <TextInput
                style={styles.input}
                placeholder={`Min. ${formatUgx(MIN_WITHDRAWAL)}`}
                placeholderTextColor={colors.textSubtle}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              {parsedAmount > 0 && parsedAmount < MIN_WITHDRAWAL ? (
                <Text style={styles.errorText}>Minimum withdrawal is {formatUgx(MIN_WITHDRAWAL)}.</Text>
              ) : null}
              {parsedAmount > ugxBalance ? (
                <Text style={styles.errorText}>Amount exceeds wallet balance.</Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Send to mobile money</Text>
              <View style={styles.phoneRow}>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="+256 7XX XXX XXX"
                  placeholderTextColor={colors.textSubtle}
                  value={phone}
                  onChangeText={(v) => { setPhone(v); setProvider(null); }}
                  onBlur={handlePhoneBlur}
                  keyboardType="phone-pad"
                />
                {validatePhone.isPending ? (
                  <ActivityIndicator color={colors.accent} style={styles.providerLoader} />
                ) : provider ? (
                  <View style={styles.providerBadge}>
                    <Text style={styles.providerBadgeLabel}>{provider.toUpperCase()}</Text>
                  </View>
                ) : null}
              </View>
              {providerError ? <Text style={styles.errorText}>{providerError}</Text> : null}
            </View>

            {errorMsg ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.errorCardText}>{errorMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, !canWithdraw && styles.primaryButtonDisabled]}
              onPress={handleWithdraw}
              disabled={!canWithdraw || withdraw.isPending}
              activeOpacity={0.88}
            >
              {withdraw.isPending ? (
                <ActivityIndicator color="#07110d" />
              ) : (
                <>
                  <Ionicons name="arrow-up-circle-outline" size={16} color="#07110d" />
                  <Text style={styles.primaryButtonLabel}>
                    Withdraw {parsedAmount > 0 ? formatUgx(parsedAmount) : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.helpText}>Funds will be sent to your mobile money account within a few minutes.</Text>
          </>
        )}

        {phase === 'success' && (
          <View style={styles.centeredBlock}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={32} color="#07110d" />
            </View>
            <Text style={styles.statusTitle}>Withdrawal initiated</Text>
            <Text style={styles.statusBody}>
              {formatUgx(parsedAmount)} is on its way to {phone}.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/wallet' as never)} activeOpacity={0.88}>
              <Text style={styles.primaryButtonLabel}>Back to wallet</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.centeredBlock}>
            <View style={styles.errorIcon}>
              <Ionicons name="close" size={28} color={colors.text} />
            </View>
            <Text style={styles.statusTitle}>Withdrawal failed</Text>
            <Text style={styles.statusBody}>{errorMsg}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => { setPhase('entry'); setErrorMsg(''); }} activeOpacity={0.88}>
              <Text style={styles.primaryButtonLabel}>Try again</Text>
            </TouchableOpacity>
          </View>
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
  balanceCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
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
    fontSize: 36,
    fontWeight: '900',
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phoneInput: {
    flex: 1,
  },
  providerLoader: {
    paddingHorizontal: 8,
  },
  providerBadge: {
    backgroundColor: colors.accentDeep,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  providerBadgeLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10,
    padding: 12,
  },
  errorCardText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
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
  helpText: {
    color: colors.textSubtle,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  centeredBlock: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 40,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  statusBody: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
