import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'tesotunes.auth.token';
let webMemoryToken: string | null = null;

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  try {
    const storage = window.localStorage;
    const probeKey = '__tesotunes_token_storage_probe__';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return null;
  }
}

export async function saveAuthToken(token: string) {
  if (Platform.OS === 'web') {
    webMemoryToken = token;
    const storage = getWebStorage();

    if (storage) {
      try {
        storage.setItem(TOKEN_KEY, token);
      } catch {
        // Keep using the in-memory fallback for this runtime.
      }
    }

    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function readAuthToken() {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();

    if (storage) {
      try {
        const storedToken = storage.getItem(TOKEN_KEY);

        if (storedToken) {
          webMemoryToken = storedToken;
          return storedToken;
        }

        return webMemoryToken;
      } catch {
        return webMemoryToken;
      }
    }

    return webMemoryToken;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearAuthToken() {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();
    storage?.removeItem(TOKEN_KEY);
    webMemoryToken = null;
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
