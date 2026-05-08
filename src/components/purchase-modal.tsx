import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useCreditBalance, useWalletBalance } from '../hooks/use-wallet';
import { useSongPurchase } from '../hooks/use-song-purchase';
import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  songId: number | string;
  songTitle: string;
  artistName: string;
  priceUgx?: number | null;
  priceCredits?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
};

type PaymentMethod = 'wallet' | 'credits';

function formatUgx(amount: number) {
  return `UGX ${amount.toLocaleString()}`;
}

export function PurchaseModal({ visible, songId, songTitle, artistName, priceUgx, priceCredits, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('wallet');
  const [phase, setPhase] = useState<'pick' | 'confirm' | 'success' | 'error'>('pick');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: walletData } = useWalletBalance();
  const { data: creditData } = useCreditBalance();
  const purchase = useSongPurchase();

  const ugxBalance = walletData?.ugx_balance ?? 0;
  const creditsBalance = creditData?.credits_balance ?? 0;

  useEffect(() => {
    if (visible) {
      setPhase('pick');
      setErrorMsg('');
    }
  }, [visible]);

  const canPayWallet = priceUgx != null && ugxBalance >= priceUgx;
  const canPayCredits = priceCredits != null && creditsBalance >= priceCredits;
  const canAfford = method === 'wallet' ? canPayWallet : canPayCredits;
  const selectedPrice = method === 'wallet' ? (priceUgx != null ? formatUgx(priceUgx) : null) : (priceCredits != null ? `${priceCredits} credits` : null);

  async function handlePurchase() {
    setPhase('confirm');
    try {
      const res = await purchase.mutateAsync({ songId, paymentMethod: method });
      if (res.success) {
        setPhase('success');
        onSuccess?.();
      } else {
        setErrorMsg(res.message ?? 'Purchase failed. Please try again.');
        setPhase('error');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setPhase('error');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {phase === 'pick' && (
          <>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={2}>{songTitle}</Text>
              <Text style={styles.songArtist}>{artistName}</Text>
            </View>

            <Text style={styles.sectionLabel}>Pay with</Text>
            <View style={styles.methodsRow}>
              {priceUgx != null ? (
                <TouchableOpacity
                  style={[styles.methodCard, method === 'wallet' && styles.methodCardActive]}
                  onPress={() => setMethod('wallet')}
                  activeOpacity={0.82}
                >
                  <Ionicons name="wallet-outline" size={20} color={method === 'wallet' ? '#07110d' : colors.text} />
                  <Text style={[styles.methodLabel, method === 'wallet' && styles.methodLabelActive]}>Wallet</Text>
                  <Text style={[styles.methodPrice, method === 'wallet' && styles.methodPriceActive]}>{formatUgx(priceUgx)}</Text>
                  <Text style={[styles.methodBalance, method === 'wallet' && styles.methodBalanceActive]}>
                    Balance: {formatUgx(ugxBalance)}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {priceCredits != null ? (
                <TouchableOpacity
                  style={[styles.methodCard, method === 'credits' && styles.methodCardActive]}
                  onPress={() => setMethod('credits')}
                  activeOpacity={0.82}
                >
                  <Ionicons name="star-outline" size={20} color={method === 'credits' ? '#07110d' : colors.text} />
                  <Text style={[styles.methodLabel, method === 'credits' && styles.methodLabelActive]}>Credits</Text>
                  <Text style={[styles.methodPrice, method === 'credits' && styles.methodPriceActive]}>{priceCredits} credits</Text>
                  <Text style={[styles.methodBalance, method === 'credits' && styles.methodBalanceActive]}>
                    Balance: {creditsBalance.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {!canAfford ? (
              <View style={styles.warningRow}>
                <Ionicons name="warning-outline" size={14} color="#facc15" />
                <Text style={styles.warningText}>
                  Insufficient balance.{' '}
                  <Text style={styles.warningLink} onPress={() => { onClose(); router.push('/wallet' as never); }}>
                    Top up your wallet
                  </Text>
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, !canAfford && styles.primaryButtonDisabled]}
              onPress={handlePurchase}
              disabled={!canAfford || !selectedPrice}
              activeOpacity={0.88}
            >
              <Ionicons name="download-outline" size={16} color="#07110d" />
              <Text style={styles.primaryButtonLabel}>
                {selectedPrice ? `Buy for ${selectedPrice}` : 'Select payment method'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostButton} onPress={onClose} activeOpacity={0.88}>
              <Text style={styles.ghostButtonLabel}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'confirm' && (
          <View style={styles.centeredBlock}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.statusTitle}>Processing purchase…</Text>
          </View>
        )}

        {phase === 'success' && (
          <View style={styles.centeredBlock}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={32} color="#07110d" />
            </View>
            <Text style={styles.statusTitle}>Purchased!</Text>
            <Text style={styles.statusBody}>
              <Text style={styles.accentText}>{songTitle}</Text> is now in your library.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={onClose} activeOpacity={0.88}>
              <Text style={styles.primaryButtonLabel}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.centeredBlock}>
            <View style={styles.errorIcon}>
              <Ionicons name="close" size={28} color={colors.text} />
            </View>
            <Text style={styles.statusTitle}>Purchase failed</Text>
            <Text style={styles.statusBody}>{errorMsg}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setPhase('pick')} activeOpacity={0.88}>
              <Text style={styles.primaryButtonLabel}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostButton} onPress={onClose} activeOpacity={0.88}>
              <Text style={styles.ghostButtonLabel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  songInfo: {
    alignItems: 'center',
    gap: 4,
  },
  songTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  songArtist: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  methodCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
    alignItems: 'center',
  },
  methodCardActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  methodLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  methodLabelActive: {
    color: '#07110d',
  },
  methodPrice: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  methodPriceActive: {
    color: '#07110d',
  },
  methodBalance: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  methodBalanceActive: {
    color: 'rgba(7,17,13,0.72)',
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
  ghostButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ghostButtonLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  centeredBlock: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  statusBody: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  accentText: {
    color: colors.accent,
    fontWeight: '700',
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
