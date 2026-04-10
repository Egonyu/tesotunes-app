import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Screen } from '../../src/components/screen';
import { useCreatePlaylist } from '../../src/hooks/use-playlists';
import { colors } from '../../src/theme/colors';

export default function NewPlaylistScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const createPlaylist = useCreatePlaylist();

  async function handleCreate() {
    if (!name.trim()) {
      return;
    }

    await createPlaylist.mutateAsync({
      name: name.trim(),
      description: description.trim(),
      isPublic,
    });

    router.replace('/playlists');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Create Playlist</Text>
        <Text style={styles.subtitle}>Start a new collection for moods, artists, or moments.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Playlist name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Teso Nights"
            placeholderTextColor={colors.textSubtle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What makes this playlist yours?"
            placeholderTextColor={colors.textSubtle}
            multiline
          />
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Public playlist</Text>
            <Text style={styles.switchHint}>Let other listeners discover and follow it.</Text>
          </View>
          <Switch value={isPublic} onValueChange={setIsPublic} thumbColor={colors.text} trackColor={{ true: colors.accent, false: '#3a3a3a' }} />
        </View>

        {createPlaylist.error ? <Text style={styles.error}>{createPlaylist.error.message}</Text> : null}

        <TouchableOpacity style={styles.submit} onPress={() => void handleCreate()} disabled={createPlaylist.isPending}>
          {createPlaylist.isPending ? <ActivityIndicator color={colors.background} /> : <Text style={styles.submitLabel}>Create playlist</Text>}
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
    gap: 18,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  switchHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  submit: {
    backgroundColor: colors.text,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitLabel: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
});
