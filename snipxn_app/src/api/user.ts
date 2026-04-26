import type {
  ChangePasswordRequest,
  GoogleMobileBindRequest,
  LinkedAccount,
  OAuthBindRequest,
  UpdateMeRequest,
  User,
  UserDevice,
} from '../types';

import { apiClient } from './axios';

const USER_BASE_URL = '/user/me';

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeStatus(value: unknown): User['status'] {
  return value === 'BANNED' || value === 'LOCKED' ? value : 'ACTIVE';
}

function normalizeUser(raw: Record<string, unknown> | null | undefined): User {
  const source = raw ?? {};
  const now = new Date().toISOString();
  const createdAt = normalizeNullableString(source.createdAt) ?? now;
  const updatedAt = normalizeNullableString(source.updatedAt) ?? createdAt;

  return {
    id: String(source.id ?? ''),
    email: normalizeNullableString(source.email) ?? '',
    nickname: normalizeNullableString(source.nickname),
    avatar: normalizeNullableString(source.avatar),
    bio: normalizeNullableString(source.bio),
    gender: normalizeNumber(source.gender, 0),
    birthday: normalizeNullableString(source.birthday),
    website: normalizeNullableString(source.website),
    github: normalizeNullableString(source.github),
    location: normalizeNullableString(source.location),
    company: normalizeNullableString(source.company),
    techStack: normalizeNullableString(source.techStack),
    storageLimit: normalizeNumber(source.storageLimit, 0),
    storageUsed: normalizeNumber(source.storageUsed, 0),
    status: normalizeStatus(source.status),
    createdAt,
    updatedAt,
  };
}

export async function getMe(): Promise<User> {
  const data = await apiClient.get<Record<string, unknown>>(USER_BASE_URL);
  return normalizeUser(data);
}

export async function updateMe(data: UpdateMeRequest): Promise<User> {
  const response = await apiClient.put<Record<string, unknown> | null, UpdateMeRequest>(
    USER_BASE_URL,
    data,
  );

  if (response && typeof response === 'object') {
    return normalizeUser(response);
  }

  return getMe();
}

export function changePassword(password: string): Promise<void> {
  return apiClient.put<void, ChangePasswordRequest>(`${USER_BASE_URL}/password`, {
    password,
  });
}

function normalizeDevice(raw: Record<string, unknown>): UserDevice {
  return {
    id: String(raw.id ?? raw.deviceId ?? ''),
    deviceName: normalizeNullableString(raw.deviceName),
    deviceId: String(raw.deviceId ?? ''),
    lastLoginIp: normalizeNullableString(raw.lastLoginIp),
    lastLoginAt: normalizeNullableString(raw.lastLoginAt) ?? new Date().toISOString(),
    isRevoked: raw.isRevoked === true,
    createdAt: normalizeNullableString(raw.createdAt) ?? new Date().toISOString(),
  };
}

export async function getDevices(): Promise<UserDevice[]> {
  const data = await apiClient.get<Record<string, unknown>[]>(`${USER_BASE_URL}/devices`);
  return Array.isArray(data) ? data.map(normalizeDevice) : [];
}

export function revokeDevice(deviceId: string): Promise<void> {
  return apiClient.delete<void>(`${USER_BASE_URL}/devices/${deviceId}`);
}

export function revokeOtherDevices(): Promise<void> {
  return apiClient.delete<void>(`${USER_BASE_URL}/devices`);
}

export function getLinkedAccounts(): Promise<LinkedAccount[]> {
  return apiClient.get<LinkedAccount[]>(`${USER_BASE_URL}/linked-accounts`);
}

export function bindGithub(code: string, redirectUri: string): Promise<void> {
  return apiClient.post<void, OAuthBindRequest>(
    `${USER_BASE_URL}/linked-accounts/github`,
    {
      code,
      redirectUri,
    },
  );
}

export function bindGoogle(code: string, redirectUri: string): Promise<void> {
  return apiClient.post<void, OAuthBindRequest>(
    `${USER_BASE_URL}/linked-accounts/google`,
    {
      code,
      redirectUri,
    },
  );
}

export function bindGoogleMobile(googleId: string): Promise<void> {
  return apiClient.post<void, GoogleMobileBindRequest>(
    `${USER_BASE_URL}/linked-accounts/google/mobile`,
    { googleId },
  );
}

export function unlinkAccount(
  identityType: LinkedAccount['identityType'],
): Promise<void> {
  return apiClient.delete<void>(`${USER_BASE_URL}/linked-accounts/${identityType}`);
}
