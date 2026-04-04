import type {
  ChangePasswordRequest,
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

function normalizeUser(raw: Record<string, unknown>): User {
  const now = new Date().toISOString();
  const createdAt = normalizeNullableString(raw.createdAt) ?? now;
  const updatedAt = normalizeNullableString(raw.updatedAt) ?? createdAt;

  return {
    id: String(raw.id ?? ''),
    email: normalizeNullableString(raw.email) ?? '',
    nickname: normalizeNullableString(raw.nickname),
    avatar: normalizeNullableString(raw.avatar),
    bio: normalizeNullableString(raw.bio),
    gender: normalizeNumber(raw.gender, 0),
    birthday: normalizeNullableString(raw.birthday),
    website: normalizeNullableString(raw.website),
    github: normalizeNullableString(raw.github),
    location: normalizeNullableString(raw.location),
    company: normalizeNullableString(raw.company),
    techStack: normalizeNullableString(raw.techStack),
    storageLimit: normalizeNumber(raw.storageLimit, 0),
    storageUsed: normalizeNumber(raw.storageUsed, 0),
    status: normalizeStatus(raw.status),
    createdAt,
    updatedAt,
  };
}

export async function getMe(): Promise<User> {
  const data = await apiClient.get<Record<string, unknown>>(USER_BASE_URL);
  return normalizeUser(data);
}

export async function updateMe(data: UpdateMeRequest): Promise<User> {
  const response = await apiClient.put<Record<string, unknown>, UpdateMeRequest>(USER_BASE_URL, data);
  return normalizeUser(response);
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

export function unlinkAccount(
  identityType: LinkedAccount['identityType'],
): Promise<void> {
  return apiClient.delete<void>(`${USER_BASE_URL}/linked-accounts/${identityType}`);
}
