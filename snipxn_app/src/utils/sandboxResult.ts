import type { RunCodeResponse } from '../types';

function pickNumber(source: RunCodeResponse, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function pickString(source: RunCodeResponse, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getSandboxStdout(response: RunCodeResponse | null): string {
  if (!response) {
    return '';
  }

  return pickString(response, ['stdout', 'output', 'result']) ?? '';
}

export function getSandboxStderr(response: RunCodeResponse | null): string {
  if (!response) {
    return '';
  }

  return pickString(response, ['stderr', 'error', 'message', 'compileOutput', 'compile_output']) ?? '';
}

export function formatSandboxDuration(response: RunCodeResponse | null): string {
  if (!response) {
    return '--';
  }

  const numericDuration = pickNumber(response, [
    'executionTimeMs',
    'timeMs',
    'durationMs',
    'runtimeMs',
  ]);

  if (numericDuration !== null) {
    return `${numericDuration} ms`;
  }

  const namedDuration = pickString(response, ['executionTime', 'duration', 'runtime']);
  if (namedDuration) {
    return namedDuration;
  }

  const secondsString = pickString(response, ['time']);
  if (secondsString) {
    return /^\d+(\.\d+)?$/.test(secondsString) ? `${secondsString} s` : secondsString;
  }

  return '--';
}

export function formatSandboxMemory(response: RunCodeResponse | null): string {
  if (!response) {
    return '--';
  }

  const memoryBytes = pickNumber(response, ['memoryBytes', 'memoryUsedBytes']);
  if (memoryBytes !== null) {
    return formatBytes(memoryBytes);
  }

  const memoryKb = pickNumber(response, ['memoryKb', 'memoryKB', 'memoryUsedKb', 'memory']);
  if (memoryKb !== null) {
    return `${memoryKb} KB`;
  }

  const memoryMb = pickNumber(response, ['memoryMb', 'memoryMB', 'memoryUsedMb']);
  if (memoryMb !== null) {
    return `${memoryMb} MB`;
  }

  return pickString(response, ['memory', 'memoryUsed']) ?? '--';
}

export function resolveSandboxRunnerStatus(response: RunCodeResponse): 'success' | 'error' | 'timeout' {
  const status = typeof response.status === 'string' ? response.status.toLowerCase() : '';

  if (status.includes('timeout')) {
    return 'timeout';
  }

  if (status.includes('error') || status.includes('fail')) {
    return 'error';
  }

  if (getSandboxStderr(response).length > 0) {
    return 'error';
  }

  return 'success';
}
