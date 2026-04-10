export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthPayload = {
  user: AuthUser;
  token: string;
};

export type RegistrationPayload = {
  message: string;
  requiresEmailVerification: boolean;
  user: AuthUser;
};
