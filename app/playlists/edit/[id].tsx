import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Screen } from '../../../src/components/screen';
import { findPlaylistById } from '../../../src/data/mock-content';
import { useDeletePlaylist, usePlaylistDetail, useUpdatePlaylist } from '../../../src/hooks/use-playlists';
import { colors } from '../../../src/theme/colors';

export default function EditPlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = usePlaylistDetail(id);
  const playlist = data ?? findPlaylistById(id);
  const updatePlaylist = useUpdatePlaylist(id);
  const deletePlaylist = useDeletePlaylist();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlist) {
      return;
    }

    setName(playlist.name);
    setDescription(playlist.description);
    setIsPublic(playlist.isPublic);
  }, [playlist]);

  async function handleSave() {
    setError(null);

    try {
      await updatePlaylist.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });

      router.replace(`/playlists/${id}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to update playlist');
    }
  }

  function handleDelete() {
    if (!id) {
      return;
    }

    Alert.alert('Delete playlist?', 'This playlist will be removed from your library.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deletePlaylist
            .mutateAsync(id)
            .then(() => router.replace('/playlists'))
            .catch((submissionError) => {
              setError(submissionError instanceof Error ? submissionError.message : 'Unable to delete playlist');
            });
        },
      },
    ]);
  }

  if (!playlist && !isLoading) {
    return (
      <Screen>
        <Text style={styles.empty}>Playlist not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Playlist settings</Text>
        <Text style={styles.title}>Edit your playlist</Text>
        <Text style={styles.subtitle}>Update the title, description, and visibility for this collection.</Text>
      </View>

      <View style={styles.form}>
        {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder="Playlist name"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            multiline
            placeholder="Describe the mood, genre, or purpose"
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchMeta}>
            <Text style={styles.label}>Public playlist</Text>
            <Text style={styles.helpText}>Turn this off to keep the playlist private in your library.</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: colors.border, true: colors.accentDeep }}
            thumbColor={isPublic ? colors.accent : colors.textMuted}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          disabled={updatePlaylist.isPending}
          style={styles.button}
          activeOpacity={0.9}
          onPress={handleSave}
        >
          {updatePlaylist.isPending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>Save changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          disabled={deletePlaylist.isPending}
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={handleDelete}
        >
          {deletePlaylist.isPending ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Text style={styles.secondaryButtonLabel}>Delete playlist</Text>
          )}
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
  textarea: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  switchMeta: {
    flex: 1,
    gap: 4,
  },
  helpText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
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
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonLabel: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    color: colors.text,
    fontSize: 16,
  },
});
