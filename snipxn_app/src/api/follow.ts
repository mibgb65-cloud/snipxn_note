import type { FollowStatsResponse, UserProfileResponse } from '../types';

import { translateLiteral } from '../i18n';
import { apiClient } from './axios';

const FOLLOW_BASE_URL = '/follow';

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Backend may return `userId` instead of `id`. Normalise once at the API boundary. */
function normalizeUser(raw: Record<string, unknown>): UserProfileResponse {
  return {
    id: String(raw.id ?? raw.userId ?? ''),
    nickname:
      normalizeNullableString(raw.nickname)?.trim() ||
      normalizeNullableString(raw.userNickname)?.trim() ||
      translateLiteral('未命名用户'),
    avatar: normalizeNullableString(raw.avatar),
    bio: normalizeNullableString(raw.bio),
    createdAt: normalizeNullableString(raw.createdAt) ?? '',
    postCount: normalizeNumber(raw.postCount),
    primaryLanguage: normalizeNullableString(raw.primaryLanguage),
    website: normalizeNullableString(raw.website),
    github: normalizeNullableString(raw.github),
    location: normalizeNullableString(raw.location),
    company: normalizeNullableString(raw.company),
    techStack: normalizeNullableString(raw.techStack),
    isFollowing: typeof raw.isFollowing === 'boolean' ? raw.isFollowing : null,
    followingCount: normalizeNumber(raw.followingCount),
    followerCount: normalizeNumber(raw.followerCount),
  };
}

function normalizeUsers(raw: Record<string, unknown>[]): UserProfileResponse[] {
  return raw.map(normalizeUser);
}

export function follow(userId: string): Promise<void> {
  return apiClient.post<void>(`${FOLLOW_BASE_URL}/${userId}`);
}

export function unfollow(userId: string): Promise<void> {
  return apiClient.delete<void>(`${FOLLOW_BASE_URL}/${userId}`);
}

/**
 * Backend returns plain UUID strings for following/followers lists.
 */
export function getFollowing(): Promise<string[]> {
  return apiClient.get<string[]>(`${FOLLOW_BASE_URL}/following`);
}

export function getFollowers(): Promise<string[]> {
  return apiClient.get<string[]>(`${FOLLOW_BASE_URL}/followers`);
}

export async function getRecommended(): Promise<UserProfileResponse[]> {
  const data = await apiClient.get<Record<string, unknown>[]>(`${FOLLOW_BASE_URL}/recommended`);
  return normalizeUsers(data);
}

export function getStats(): Promise<FollowStatsResponse> {
  return apiClient.get<FollowStatsResponse>(`${FOLLOW_BASE_URL}/stats`);
}

export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  const data = await apiClient.get<Record<string, unknown>>(`${FOLLOW_BASE_URL}/user/${userId}/profile`);
  return normalizeUser(data);
}
