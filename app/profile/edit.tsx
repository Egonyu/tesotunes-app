import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../src/components/screen';
import { useUpdateUserProfile, useUploadAvatar, useUserProfile } from '../../src/hooks/use-user-profile';
import { colors } from '../../src/theme/colors';

export default function EditProfileScreen() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const uploadAvatar = useUploadAvatar();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setName(profile.name);
    setBio(profile.bio ?? '');
    setWebsite('');
    setPhone('');
  }, [profile]);

  async function handlePickAvatar() {
    setAvatarError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setLocalAvatarUri(uri);

    try {
      await uploadAvatar.mutateAsync(uri);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to upload photo.');
    }
  }

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

  const avatarSource = localAvatarUri ?? profile?.avatarUrl ?? null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>Keep your account details current across mobile and web.</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          {avatarSource ? (
            <Image source={{ uri: avatarSource }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={colors.textSubtle} />
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.avatarButton} onPress={() => void handlePickAvatar()} disabled={uploadAvatar.isPending}>
          {uploadAvatar.isPending ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={styles.avatarButtonLabel}>Change Photo</Text>
          )}
        </TouchableOpacity>
        {avatarError ? <Text style={styles.error}>{avatarError}</Text> : null}
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
  avatarSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 96,
    height: 96,
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  avatarButton: {
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  avatarButtonLabel: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
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
