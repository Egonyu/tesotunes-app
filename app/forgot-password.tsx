import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Screen } from '../src/components/screen';
import { forgotPassword } from '../src/services/auth/session';
import { colors } from '../src/theme/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Enter your email address.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await forgotPassword(normalizedEmail);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Screen contentContainerStyle={styles.screen}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>TesoTunes</Text>
          <Text style={styles.title}>Check your inbox.</Text>
          <Text style={styles.subtitle}>
            If that email is registered with TesoTunes, we've sent a reset link. Check your spam folder if it doesn't arrive within a few minutes.
          </Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/sign-in')}>
          <Text style={styles.buttonLabel}>Back to sign in</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TesoTunes</Text>
        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send a reset link.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity disabled={submitting} style={styles.button} activeOpacity={0.9} onPress={() => void handleSubmit()}>
          {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonLabel}>Send reset link</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.textButton} onPress={() => router.back()}>
          <Text style={styles.textButtonLabel}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    minHeight: '100%',
    gap: 28,
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
