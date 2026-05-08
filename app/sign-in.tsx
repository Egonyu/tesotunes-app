import { router, useLocalSearchParams } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Screen } from '../src/components/screen';
import { ApiError } from '../src/services/api/client';
import { resendVerificationEmail, signIn, signInWithSocial } from '../src/services/auth/session';
import { colors } from '../src/theme/colors';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const params = useLocalSearchParams<{ registered?: string; email?: string; verified?: string }>();
  const initialEmail = params.email ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationPrompt, setVerificationPrompt] = useState<string | null>(null);
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    params.verified === '1'
      ? 'Email verified successfully. You can sign in now.'
      : params.registered === '1'
        ? `Account created${params.email ? ` for ${params.email}` : ''}. Verify your email, then sign in here.`
        : null
  );

  const googleEnabled = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  );

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setVerificationPrompt(null);

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/library');
    } catch (submissionError) {
      if (submissionError instanceof ApiError && submissionError.code === 'EMAIL_NOT_VERIFIED') {
        setVerificationPrompt(submissionError.message);
        return;
      }

      setError(submissionError instanceof Error ? submissionError.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendVerification() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Enter your email address first so we can resend the verification link.');
      return;
    }

    setResendSubmitting(true);
    setError(null);

    try {
      const result = await resendVerificationEmail(normalizedEmail);
      setNotice(result);
      router.replace({
        pathname: '/verify-email',
        params: { resent: '1', email: normalizedEmail },
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to resend verification email.');
    } finally {
      setResendSubmitting(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TesoTunes</Text>
        <Text style={styles.title}>Sign in to unlock your library and offline world.</Text>
        <Text style={styles.subtitle}>Use your existing TesoTunes account from the web platform.</Text>
        {notice ? <Text style={styles.success}>{notice}</Text> : null}
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="egony@example.com"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            secureTextEntry
            placeholder="Your password"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {verificationPrompt ? <Text style={styles.success}>{verificationPrompt}</Text> : null}

        <TouchableOpacity disabled={submitting} style={styles.button} activeOpacity={0.9} onPress={handleSubmit}>
          {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonLabel}>Continue</Text>}
        </TouchableOpacity>

        {googleEnabled ? (
          <GoogleSignInButton
            onSuccess={() => router.replace('/(tabs)/library')}
            onError={setError}
          />
        ) : null}

        {verificationPrompt ? (
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleResendVerification} disabled={resendSubmitting}>
            {resendSubmitting ? <ActivityIndicator color={colors.text} /> : <Text style={styles.secondaryButtonLabel}>Resend Verification Email</Text>}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.textButton} activeOpacity={0.85} onPress={() => router.push('/sign-up')}>
          <Text style={styles.textButtonLabel}>New to TesoTunes? Create account</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

function GoogleSignInButton({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const [loading, setLoading] = useState(false);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest(
    {
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
    },
    { scheme: 'tesotunes', path: 'sign-in' }
  );

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;

    const accessToken = googleResponse.authentication?.accessToken;
    const idToken = googleResponse.authentication?.idToken;
    if (!accessToken && !idToken) {
      onError('Google sign-in did not return an authentication token.');
      return;
    }

    setLoading(true);
    void signInWithSocial('google', {
      accessToken,
      idToken,
      deviceName: 'expo_google',
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
    })
      .then(onSuccess)
      .catch((err) => onError(err instanceof Error ? err.message : 'Unable to complete Google sign in'))
      .finally(() => setLoading(false));
  }, [googleResponse]);

  return (
    <TouchableOpacity
      style={styles.secondaryButton}
      activeOpacity={0.85}
      onPress={() => void googlePromptAsync()}
      disabled={loading || !googleRequest}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={styles.secondaryButtonLabel}>Continue with Google</Text>
      )}
    </TouchableOpacity>
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
  form: {
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#191919',
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.text,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 6,
  },
  buttonLabel: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  success: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 18,
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
  textButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  textButtonLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
