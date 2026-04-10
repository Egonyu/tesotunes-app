import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Screen } from '../src/components/screen';
import { apiGet, getApiBaseUrl } from '../src/services/api/client';
import { signIn } from '../src/services/auth/session';
import { colors } from '../src/theme/colors';

export default function SignInScreen() {
  const params = useLocalSearchParams<{ registered?: string; email?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/library');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  async function testApiConnection() {
    setDiagnostic('Testing API...');

    try {
      const response = await apiGet<{ data?: unknown[] }>('/mobile/trending/songs');
      setDiagnostic(`API reachable at ${getApiBaseUrl()} with ${response.data?.length ?? 0} songs returned.`);
    } catch (connectionError) {
      setDiagnostic(connectionError instanceof Error ? connectionError.message : 'API test failed');
    }
  }

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TesoTunes</Text>
        <Text style={styles.title}>Sign in to unlock your library and offline world.</Text>
        <Text style={styles.subtitle}>Use your existing TesoTunes account from the web platform.</Text>
        <Text style={styles.endpoint}>API: {getApiBaseUrl()}</Text>
        {params.registered === '1' ? (
          <Text style={styles.success}>
            Account created{params.email ? ` for ${params.email}` : ''}. Verify your email, then sign in here.
          </Text>
        ) : null}
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
          <Text style={styles.label}>Password</Text>
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
        {diagnostic ? <Text style={styles.diagnostic}>{diagnostic}</Text> : null}

        <TouchableOpacity disabled={submitting} style={styles.button} activeOpacity={0.9} onPress={handleSubmit}>
          {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonLabel}>Continue</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={testApiConnection}>
          <Text style={styles.secondaryButtonLabel}>Test API Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.textButton} activeOpacity={0.85} onPress={() => router.push('/sign-up')}>
          <Text style={styles.textButtonLabel}>New to TesoTunes? Create account</Text>
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
  endpoint: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 18,
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
  success: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 18,
  },
  diagnostic: {
    color: colors.textMuted,
    fontSize: 12,
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
