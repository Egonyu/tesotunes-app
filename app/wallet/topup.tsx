import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { useInitiateTopup, usePollPaymentStatus, useValidatePhone, useWalletBalance } from '../../src/hooks/use-wallet';
import { colors } from '../../src/theme/colors';

const AMOUNT_PRESETS = [5000, 10000, 20000, 50000, 100000];

function formatUgx(n: number) {
  return `UGX ${n.toLocaleString()}`;
}

type Phase = 'entry' | 'validating' | 'initiating' | 'polling' | 'success' | 'error';

export default function TopupScreen() {
  const [amount, setAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<string | null>(null);
  const [providerError, setProviderError] = useState('');
  const [phase, setPhase] = useState<Phase>('entry');
  const [reference, setReference] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const validatePhone = useValidatePhone();
  const initiate = useInitiateTopup();
  const poll = usePollPaymentStatus();
  const { refetch: refetchBalance } = useWalletBalance();

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'polling' || !reference) return;
    const interval = setInterval(async () => {
      try {
        const status = await poll.mutateAsync(reference);
        if (status.status === 'completed') {
          clearInterval(interval);
          pollRef.current = null;
          await refetchBalance();
          setPhase('success');
        } else if (status.status === 'failed' || status.status === 'cancelled') {
          clearInterval(interval);
          pollRef.current = null;
          setErrorMsg('Payment was declined or cancelled by your provider.');
          setPhase('error');
        }
      } catch {
        // Keep polling — transient errors are expected
      }
    }, 4000);
    pollRef.current = interval;
    return () => clearInterval(interval);
  }, [phase, reference]);

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
        setProviderError(res.message ?? 'Phone number not recognized. Use MTN or Airtel number.');
      }
    } catch {
      setProviderError('Could not validate phone number.');
    }
  }

  async function handleInitiate() {
    if (!phone || !provider) return;
    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
    if (!finalAmount || finalAmount < 500) {
      setErrorMsg('Minimum top-up amount is UGX 500.');
      return;
    }
    setPhase('initiating');
    try {
      const res = await initiate.mutateAsync({ amount: finalAmount, phone, purpose: 'wallet_topup' });
      if (res.success) {
        setReference(res.reference);
        setPhase('polling');
      } else {
        setErrorMsg(res.message ?? 'Could not initiate payment. Please try again.');
        setPhase('error');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setPhase('error');
    }
  }

  const displayAmount = customAmount ? parseInt(customAmount, 10) || 0 : amount;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top Up Wallet</Text>
        </View>

        {(phase === 'entry' || phase === 'error') && (
          <>
            <View style={styles.amountCard}>
              <Text style={styles.amountEyebrow}>You're adding</Text>
              <Text style={styles.amountDisplay}>{formatUgx(displayAmount)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select amount</Text>
              <View style={styles.presetGrid}>
                {AMOUNT_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, !customAmount && amount === preset && styles.presetChipActive]}
                    onPress={() => { setAmount(preset); setCustomAmount(''); }}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.presetLabel, !customAmount && amount === preset && styles.presetLabelActive]}>
                      {formatUgx(preset)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Or enter custom amount (UGX)"
                placeholderTextColor={colors.textSubtle}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mobile money number</Text>
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
              {phase === 'error' ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (!provider || !phone) && styles.primaryButtonDisabled]}
              onPress={handleInitiate}
              disabled={!provider || !phone || initiate.isPending}
              activeOpacity={0.88}
            >
              {initiate.isPending ? (
                <ActivityIndicator color="#07110d" />
              ) : (
                <>
                  <Ionicons name="phone-portrait-outline" size={16} color="#07110d" />
                  <Text style={styles.primaryButtonLabel}>Request {formatUgx(displayAmount)}</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.helpText}>You will receive a prompt on your phone to approve the payment.</Text>
          </>
        )}

        {phase === 'initiating' && (
          <View style={styles.centeredBlock}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.statusTitle}>Sending payment request…</Text>
          </View>
        )}

        {phase === 'polling' && (
          <View style={styles.centeredBlock}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.statusTitle}>Waiting for approval</Text>
            <Text style={styles.statusBody}>
              Check your phone and approve the {formatUgx(displayAmount)} request from your provider.
            </Text>
            <View style={styles.providerPill}>
              <Ionicons name="phone-portrait-outline" size={14} color={colors.textMuted} />
              <Text style={styles.providerPillLabel}>{phone}</Text>
            </View>
          </View>
        )}

        {phase === 'success' && (
          <View style={styles.centeredBlock}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={32} color="#07110d" />
            </View>
            <Text style={styles.statusTitle}>Wallet topped up!</Text>
            <Text style={styles.statusBody}>{formatUgx(displayAmount)} has been added to your wallet.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()} activeOpacity={0.88}>
              <Text style={styles.primaryButtonLabel}>Back to wallet</Text>
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
  amountCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountEyebrow: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountDisplay: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '900',
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
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  presetLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  presetLabelActive: {
    color: '#07110d',
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
  providerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  providerPillLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
