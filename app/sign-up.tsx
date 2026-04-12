import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Screen } from '../src/components/screen';
import { signUp } from '../src/services/auth/session';
import { colors } from '../src/theme/colors';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (password !== passwordConfirmation) {
      setSubmitting(false);
      setError('Passwords do not match.');
      return;
    }

    try {
      const result = await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        passwordConfirmation,
      });

      setSuccess(result.message);

      router.replace({
        pathname: '/verify-email',
        params: { sent: '1', email: result.user.email },
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to create your account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TesoTunes</Text>
        <Text style={styles.title}>Create your account and start building your music world.</Text>
        <Text style={styles.subtitle}>
          Registration stays simple for the MVP. After signup, email verification is required before sign-in.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            placeholder="Your name"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

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
            placeholder="Create a password"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            secureTextEntry
            placeholder="Repeat your password"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <TouchableOpacity disabled={submitting} style={styles.button} activeOpacity={0.9} onPress={handleSubmit}>
          {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonLabel}>Create account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.replace('/sign-in')}>
          <Text style={styles.secondaryButtonLabel}>Already have an account? Sign in</Text>
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
});
