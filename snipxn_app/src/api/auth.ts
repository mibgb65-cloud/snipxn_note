import type {
  CheckEmailRequest,
  CheckEmailResponse,
  LoginRequest,
  LoginResponse,
  OAuthLoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendCodeRequest,
  TokenResponse,
} from '../types';

import { apiClient } from './axios';

const AUTH_BASE_URL = '/auth';

interface RawLoginResponse {
  user: {
    id: string;
    email?: string | null;
    nickname: string | null;
    avatar: string | null;
    bio: string | null;
    gender?: number | null;
    birthday?: string | null;
    website?: string | null;
    github?: string | null;
    location?: string | null;
    company?: string | null;
    techStack?: string | null;
    storageUsed: number;
    storageLimit: number;
    status?: 'ACTIVE' | 'BANNED' | 'LOCKED' | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  token: {
    accessToken: string;
    refreshToken: string;
  };
}

function normalizeLoginResponse(response: RawLoginResponse): LoginResponse {
  const nickname = response.user.nickname?.trim() ?? '';

  return {
    accessToken: response.token.accessToken,
    refreshToken: response.token.refreshToken,
    isNewUser: nickname.length === 0,
    userInfo: {
      id: response.user.id,
      email: response.user.email ?? null,
      nickname: response.user.nickname,
      avatar: response.user.avatar,
      bio: response.user.bio,
      gender: response.user.gender ?? null,
      birthday: response.user.birthday ?? null,
      website: response.user.website ?? null,
      github: response.user.github ?? null,
      location: response.user.location ?? null,
      company: response.user.company ?? null,
      techStack: response.user.techStack ?? null,
      storageUsed: response.user.storageUsed,
      storageLimit: response.user.storageLimit,
      status: response.user.status ?? null,
      createdAt: response.user.createdAt ?? null,
      updatedAt: response.user.updatedAt ?? null,
    },
  };
}

export function checkEmail(email: string): Promise<CheckEmailResponse> {
  return apiClient.post<CheckEmailResponse, CheckEmailRequest>(
    `${AUTH_BASE_URL}/check-email`,
    { email },
  );
}

export function sendCode(req: SendCodeRequest): Promise<void> {
  return apiClient.post<void, SendCodeRequest>(`${AUTH_BASE_URL}/code`, req);
}

export function register(req: RegisterRequest): Promise<void> {
  return apiClient.post<void, RegisterRequest>(`${AUTH_BASE_URL}/register`, req);
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<RawLoginResponse, LoginRequest>(
    `${AUTH_BASE_URL}/login`,
    req,
  );

  return normalizeLoginResponse(response);
}

export function refresh(req: RefreshTokenRequest): Promise<TokenResponse> {
  return apiClient.post<TokenResponse, RefreshTokenRequest>(
    `${AUTH_BASE_URL}/refresh`,
    req,
  );
}

export function resetPassword(req: ResetPasswordRequest): Promise<void> {
  return apiClient.post<void, ResetPasswordRequest>(
    `${AUTH_BASE_URL}/reset-password`,
    req,
  );
}

export function logout(): Promise<void> {
  return apiClient.post<void>(`${AUTH_BASE_URL}/logout`);
}

export function oauthGithub(
  code: string,
  redirectUri: string,
  deviceId: string,
  deviceName: string,
): Promise<LoginResponse> {
  return apiClient
    .post<RawLoginResponse, OAuthLoginRequest>(`${AUTH_BASE_URL}/oauth/github`, {
      code,
      redirectUri,
      deviceId,
      deviceName,
    })
    .then(normalizeLoginResponse);
}

export function oauthGoogle(
  code: string,
  redirectUri: string,
  deviceId: string,
  deviceName: string,
): Promise<LoginResponse> {
  return apiClient
    .post<RawLoginResponse, OAuthLoginRequest>(`${AUTH_BASE_URL}/oauth/google`, {
      code,
      redirectUri,
      deviceId,
      deviceName,
    })
    .then(normalizeLoginResponse);
}
