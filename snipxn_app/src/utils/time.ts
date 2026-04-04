import { getCurrentAppLanguage } from '../i18n';

import type { AppLanguage } from './preferences';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDate(date: Date, language: AppLanguage): string {
  if (language === 'en-US') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseISO(str: string): Date {
  return new Date(str);
}

export function toISOString(): string {
  return new Date().toISOString();
}

export function formatRelativeTime(
  isoString: string,
  language: AppLanguage = getCurrentAppLanguage(),
): string {
  const date = parseISO(isoString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = Math.max(now.getTime() - date.getTime(), 0);

  if (diffMs < MINUTE) {
    return language === 'en-US' ? 'Just now' : '刚刚';
  }

  if (diffMs < HOUR) {
    const minutes = Math.floor(diffMs / MINUTE);
    return language === 'en-US' ? `${minutes} min ago` : `${minutes}分钟前`;
  }

  if (startOfDay(now).getTime() === startOfDay(date).getTime()) {
    const hours = Math.floor(diffMs / HOUR);
    return language === 'en-US' ? `${hours} hr ago` : `${hours}小时前`;
  }

  const dayDiff = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY,
  );

  if (dayDiff === 1) {
    return language === 'en-US' ? 'Yesterday' : '昨天';
  }

  return formatDate(date, language);
}
