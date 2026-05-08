import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCreditBalance } from '../hooks/use-wallet';
import { useTipArtist } from '../hooks/use-tip-artist';
import { colors } from '../theme/colors';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

type Props = {
  visible: boolean;
  recipientId: number | string;
  recipientType: 'artist' | 'song';
  recipientName: string;
  onClose: () => void;
  onSuccess?: (creditsRemaining: number) => void;
};

export function TipModal({ visible, recipientId, recipientType, recipientName, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState<number>(50);
  const [phase, setPhase] = useState<'pick' | 'confirm' | 'success' | 'error'>('pick');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: creditData } = useCreditBalance();
  const tip = useTipArtist();

  const creditsBalance = creditData?.credits_balance ?? 0;

  useEffect(() => {
    if (visible) {
      setPhase('pick');
      setErrorMsg('');
    }
  }, [visible]);

  async function handleConfirm() {
    setPhase('confirm');
    try {
      const res = await tip.mutateAsync({ recipient_id: recipientId, recipient_type: recipientType, amount: selected });
      if (res.success) {
        setPhase('success');
        onSuccess?.(res.credits_remaining);
      } else {
        setErrorMsg(res.message ?? 'Tip failed. Please try again.');
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
            <Text style={styles.title}>Tip {recipientName}</Text>
            <Text style={styles.subtitle}>
              Your credits balance: <Text style={styles.accentText}>{creditsBalance.toLocaleString()} credits</Text>
            </Text>

            <View style={styles.grid}>
              {PRESET_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.presetChip, selected === amount && styles.presetChipActive]}
                  onPress={() => setSelected(amount)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.presetLabel, selected === amount && styles.presetLabelActive]}>
                    {amount}
                  </Text>
                  <Text style={[styles.presetUnit, selected === amount && styles.presetUnitActive]}>credits</Text>
                </TouchableOpacity>
              ))}
            </View>

            {creditsBalance < selected ? (
              <View style={styles.warningRow}>
                <Ionicons name="warning-outline" size={14} color="#facc15" />
                <Text style={styles.warningText}>Not enough credits. Top up your wallet first.</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, creditsBalance < selected && styles.primaryButtonDisabled]}
              onPress={handleConfirm}
              disabled={creditsBalance < selected}
              activeOpacity={0.88}
            >
              <Ionicons name="heart" size={16} color="#07110d" />
              <Text style={styles.primaryButtonLabel}>Send {selected} credits</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostButton} onPress={onClose} activeOpacity={0.88}>
              <Text style={styles.ghostButtonLabel}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'confirm' && (
          <View style={styles.centeredBlock}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.statusTitle}>Sending tip…</Text>
          </View>
        )}

        {phase === 'success' && (
          <View style={styles.centeredBlock}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={32} color="#07110d" />
            </View>
            <Text style={styles.statusTitle}>Tip sent!</Text>
            <Text style={styles.statusBody}>
              You sent <Text style={styles.accentText}>{selected} credits</Text> to {recipientName}.
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
            <Text style={styles.statusTitle}>Tip failed</Text>
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  accentText: {
    color: colors.accent,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  presetChip: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
  },
  presetChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  presetLabel: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  presetLabelActive: {
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
    color: '#07110d',
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
