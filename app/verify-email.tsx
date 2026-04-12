import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '../src/components/screen';
import { ApiError } from '../src/services/api/client';
import { resendVerificationEmail, verifyEmailLink } from '../src/services/auth/session';
import { colors } from '../src/theme/colors';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    sent?: string;
    resent?: string;
    status?: string;
    reason?: string;
    id?: string;
    hash?: string;
    expires?: string;
    signature?: string;
  }>();
  const email = params.email ?? '';
  const verificationPayload = useMemo(() => {
    if (!params.id || !params.hash || !params.expires || !params.signature) {
      return null;
    }

    const id = Number(params.id);
    const expires = Number(params.expires);
    if (!Number.isFinite(id) || !Number.isFinite(expires)) {
      return null;
    }

    return {
      id,
      hash: params.hash,
      expires,
      signature: params.signature,
    };
  }, [params.expires, params.hash, params.id, params.signature]);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(verificationPayload));
  const [message, setMessage] = useState<string | null>(
    params.status === 'verified'
      ? 'Email verified successfully. You can sign in now.'
      : params.status === 'already-verified'
        ? 'This email was already verified. You can sign in now.'
        : params.status === 'failed'
          ? params.reason === 'expired'
            ? 'This verification link expired. Request a fresh email below.'
            : 'This verification link is invalid. Request a fresh email below.'
          : params.sent === '1'
      ? `We sent a verification email to ${email || 'your inbox'}.`
      : params.resent === '1'
        ? `A fresh verification email was sent to ${email || 'your inbox'}.`
        : null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!verificationPayload) {
      setVerifying(false);
      return;
    }

    let cancelled = false;
    setVerifying(true);
    setError(null);

    void verifyEmailLink(verificationPayload)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setMessage(result);
        router.replace({
          pathname: '/sign-in',
          params: {
            verified: '1',
            email,
          },
        });
      })
      .catch((verificationError) => {
        if (cancelled) {
          return;
        }

        if (verificationError instanceof ApiError) {
          setError(verificationError.message);
        } else {
          setError(verificationError instanceof Error ? verificationError.message : 'Unable to verify email.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setVerifying(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [email, verificationPayload]);

  async function handleResend() {
    if (!email) {
      setError('Enter your email on the sign-in screen so we know where to resend the verification link.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await resendVerificationEmail(email);
      setMessage(result);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to resend verification email.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Verify Email</Text>
        <Text style={styles.title}>Confirm your email before unlocking your library.</Text>
        <Text style={styles.subtitle}>
          {email
            ? `Check ${email} for the verification link, then come back and sign in.`
            : 'Check your inbox for the verification link, then come back and sign in.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What to do next</Text>
        <Text style={styles.cardCopy}>1. Open the verification email from TesoTunes.</Text>
        <Text style={styles.cardCopy}>2. Tap the verification link.</Text>
        <Text style={styles.cardCopy}>3. If the app opens, verification will complete automatically here.</Text>

        {verifying ? <ActivityIndicator color={colors.accent} /> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={() => router.replace('/sign-in')}>
          <Text style={styles.primaryButtonLabel}>Back To Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleResend} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.text} /> : <Text style={styles.secondaryButtonLabel}>Resend Verification Email</Text>}
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    minHeight: '100%',
  },
  hero: {
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
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  cardCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  success: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: colors.text,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 6,
  },
  primaryButtonLabel: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
