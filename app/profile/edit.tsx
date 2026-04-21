import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Screen } from '../../src/components/screen';
import { useUpdateUserProfile, useUserProfile } from '../../src/hooks/use-user-profile';
import { colors } from '../../src/theme/colors';

export default function EditProfileScreen() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setName(profile.name);
    setBio(profile.bio ?? '');
    setWebsite('');
    setPhone('');
  }, [profile]);

  async function handleSave() {
    setSavedNotice(null);

    await updateProfile.mutateAsync({
      name: name.trim(),
      bio: bio.trim() || undefined,
      website: website.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    setSavedNotice('Profile updated from the live TesoTunes account.');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>Keep your account details current across mobile and web.</Text>
      </View>

      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textSubtle} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell listeners a little about yourself"
            placeholderTextColor={colors.textSubtle}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
            placeholder="https://example.com"
            placeholderTextColor={colors.textSubtle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+256..."
            placeholderTextColor={colors.textSubtle}
          />
        </View>

        {savedNotice ? <Text style={styles.success}>{savedNotice}</Text> : null}
        {updateProfile.error ? <Text style={styles.error}>{updateProfile.error.message}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={() => void handleSave()} disabled={updateProfile.isPending || !name.trim()}>
          {updateProfile.isPending ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonLabel}>Save changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonLabel}>Back</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
  textarea: {
    minHeight: 110,
    textAlignVertical: 'top',
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
});
