import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSummary, formatRelativeTime, generateUUID, parseISO } from '../src/utils';

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(),
}));

describe('utils', () => {
  afterEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    await AsyncStorage.clear();
  });

  test('buildSummary removes markdown syntax and trims to plain text', () => {
    const summary = buildSummary(`# Title\n\n**Hello** [world](https://example.com)\n- item\n> quote\n\n\`const value = 1;\``);

    expect(summary).toBe('Title Hello world item quote const value = 1;');
  });

  test('buildSummary truncates content to 200 characters', () => {
    const summary = buildSummary('a'.repeat(240));

    expect(summary).toHaveLength(200);
  });

  test('formatRelativeTime returns the expected relative labels', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-31T12:00:00.000Z'));

    expect(formatRelativeTime('2026-03-31T11:59:40.000Z')).toBe('刚刚');
    expect(formatRelativeTime('2026-03-31T11:55:00.000Z')).toBe('5分钟前');
    expect(formatRelativeTime('2026-03-31T09:00:00.000Z')).toBe('3小时前');
    expect(formatRelativeTime('2026-03-30T12:00:00.000Z')).toBe('昨天');
    expect(formatRelativeTime('2025-03-15T12:00:00.000Z')).toBe('2025-03-15');
  });

  test('parseISO returns a valid Date instance', () => {
    const parsed = parseISO('2026-03-31T12:00:00.000Z');

    expect(parsed.toISOString()).toBe('2026-03-31T12:00:00.000Z');
  });

  test('generateUUID returns a v4 uuid', () => {
    expect(generateUUID()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test('getDeviceId prefixes and caches the generated id', async () => {
    jest.resetModules();

    const { getUniqueId } = require('react-native-device-info') as {
      getUniqueId: jest.Mock;
    };
    const storage = require('@react-native-async-storage/async-storage') as {
      getItem: (key: string) => Promise<string | null>;
    };

    getUniqueId.mockResolvedValue('device-123');

    const { getDeviceId } = require('../src/utils/deviceId') as {
      getDeviceId: () => Promise<string>;
    };

    await expect(getDeviceId()).resolves.toBe('Android_device-123');
    await expect(getDeviceId()).resolves.toBe('Android_device-123');
    await expect(storage.getItem('@snipxn/device-id')).resolves.toBe(
      'Android_device-123',
    );
    expect(getUniqueId).toHaveBeenCalledTimes(1);
  });
});
