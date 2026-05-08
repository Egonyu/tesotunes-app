import { clearAuthToken, readAuthToken, saveAuthToken } from './token-storage';
import { apiGet, apiPost, getApiBaseUrl, setOnRefreshToken, setOnUnauthorized } from '../api/client';
import { loadLibraryCache } from '../storage/library-cache';
import { useAuthStore } from '../../store/auth-store';
import { useLibraryStore } from '../../store/library-store';
import { AuthPayload, AuthUser, RegistrationPayload } from '../../types/auth';

type AuthResponse = {
  data: {
    id?: number | string;
    name?: string;
    email?: string;
  };
  token: string;
  token_type?: string;
};

type UserResponse = {
  data?: {
    id?: number | string;
    name?: string;
    email?: string;
  };
  id?: number | string;
  name?: string;
  email?: string;
};

type RegisterResponse = {
  message?: string;
  requires_email_verification?: boolean;
  data?: {
    id?: number | string;
    name?: string;
    email?: string;
  };
};

type VerificationResendResponse = {
  message?: string;
};

type VerificationCompleteResponse = {
  message?: string;
};

function normalizeUser(input?: UserResponse['data'] | UserResponse | null): AuthUser {
  return {
    id: String(input?.id ?? ''),
    name: input?.name || 'TesoTunes User',
    email: input?.email || '',
  };
}

export function registerAuthInterceptor(): void {
  setOnRefreshToken(async () => {
    const storedToken = await readAuthToken();
    if (!storedToken) return null;

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (!response.ok) return null;

      const data = (await response.json()) as { token?: string };
      const newToken = data.token;
      if (!newToken) return null;

      await saveAuthToken(newToken);
      const store = useAuthStore.getState();
      if (store.user) {
        store.setSession({ user: store.user, token: newToken });
      }
      return newToken;
    } catch {
      return null;
    }
  });

  setOnUnauthorized(() => {
    void clearAuthToken();
    useAuthStore.getState().clearSession();
  });
}

export async function bootstrapSession() {
  const token = await readAuthToken();
  const store = useAuthStore.getState();

  if (!token) {
    store.clearSession();
    return;
  }

  store.setStatus('loading');

  try {
    const [response, libraryCache] = await Promise.all([
      apiGet<UserResponse>('/auth/user', token),
      loadLibraryCache(),
    ]);
    store.setSession({
      token,
      user: normalizeUser(response.data ?? response),
    });
    const { setLikedTrackIds, setFollowedArtistIds } = useLibraryStore.getState();
    setLikedTrackIds(new Set(libraryCache.likedTrackIds));
    setFollowedArtistIds(new Set(libraryCache.followedArtistIds));
  } catch {
    await clearAuthToken();
    store.clearSession();
  }
}

export async function signIn(email: string, password: string): Promise<AuthPayload> {
  const response = await apiPost<AuthResponse, { email: string; password: string; remember_me: boolean }>(
    '/auth/login',
    { email, password, remember_me: true }
  );

  const payload = {
    token: response.token,
    user: normalizeUser(response.data),
  };

  await saveAuthToken(payload.token);
  useAuthStore.getState().setSession(payload);

  return payload;
}

export async function signInWithSocial(provider: 'google' | 'facebook', input: {
  accessToken?: string;
  idToken?: string;
  deviceName?: string;
  platform?: 'ios' | 'android' | 'web';
}): Promise<AuthPayload> {
  const response = await apiPost<AuthResponse, {
    access_token?: string;
    id_token?: string;
    device_name: string;
    platform: 'ios' | 'android' | 'web';
  }>(`/auth/social/${provider}/exchange`, {
    access_token: input.accessToken,
    id_token: input.idToken,
    device_name: input.deviceName ?? 'expo_social',
    platform: input.platform ?? 'web',
  });

  const payload = {
    token: response.token,
    user: normalizeUser(response.data),
  };

  await saveAuthToken(payload.token);
  useAuthStore.getState().setSession(payload);

  return payload;
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}): Promise<RegistrationPayload> {
  const response = await apiPost<
    RegisterResponse,
    {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
    }
  >('/auth/register', {
    name: input.name,
    email: input.email,
    password: input.password,
    password_confirmation: input.passwordConfirmation,
  });

  return {
    message: response.message || 'Registration successful. Please verify your email before signing in.',
    requiresEmailVerification: response.requires_email_verification ?? true,
    user: normalizeUser(response.data),
  };
}

export async function signOut() {
  const token = useAuthStore.getState().token;

  try {
    if (token) {
      await apiPost('/auth/logout', {}, token);
    }
  } catch {
    // Local cleanup still matters even if the API call fails.
  }

  await clearAuthToken();
  useAuthStore.getState().clearSession();
}

export async function resendVerificationEmail(email: string) {
  const response = await apiPost<VerificationResendResponse, { email: string }>('/auth/email/resend', {
    email,
  });

  return response.message || 'If your account still requires verification, we have sent a fresh verification email.';
}

export async function forgotPassword(email: string) {
  const response = await apiPost<{ message?: string }, { email: string }>('/auth/forgot-password', { email });
  return response.message || 'If that email is registered, a password reset link has been sent.';
}

export async function verifyEmailLink(input: {
  id: number;
  hash: string;
  expires: number;
  signature: string;
}) {
  const response = await apiPost<
    VerificationCompleteResponse,
    {
      id: number;
      hash: string;
      expires: number;
      signature: string;
    }
  >('/auth/email/verify', input);

  return response.message || 'Email verified successfully.';
}
