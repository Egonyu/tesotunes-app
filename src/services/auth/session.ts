import { clearAuthToken, readAuthToken, saveAuthToken } from './token-storage';
import { apiGet, apiPost } from '../api/client';
import { useAuthStore } from '../../store/auth-store';
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

export async function bootstrapSession() {
  const token = await readAuthToken();
  const store = useAuthStore.getState();

  if (!token) {
    store.clearSession();
    return;
  }

  store.setStatus('loading');

  try {
    const response = await apiGet<UserResponse>('/auth/user', token);
    store.setSession({
      token,
      user: normalizeUser(response.data ?? response),
    });
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
