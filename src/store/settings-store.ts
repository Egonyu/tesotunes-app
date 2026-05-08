import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export type AudioQuality = 'low' | 'normal' | 'high';

const QUALITY_KEY = 'tesotunes.settings.audio_quality';

type SettingsState = {
  audioQuality: AudioQuality;
  hydrated: boolean;
  setAudioQuality: (quality: AudioQuality) => void;
  loadSettings: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  audioQuality: 'normal',
  hydrated: false,
  setAudioQuality: async (quality) => {
    set({ audioQuality: quality });
    try {
      await SecureStore.setItemAsync(QUALITY_KEY, quality);
    } catch {
      // Best-effort persistence
    }
  },
  loadSettings: async () => {
    try {
      const stored = await SecureStore.getItemAsync(QUALITY_KEY);
      if (stored === 'low' || stored === 'normal' || stored === 'high') {
        set({ audioQuality: stored, hydrated: true });
        return;
      }
    } catch {
      // Fall through to defaults
    }
    set({ hydrated: true });
  },
}));
