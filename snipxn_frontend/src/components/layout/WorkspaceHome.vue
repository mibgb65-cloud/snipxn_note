<template>
  <section class="panel editor-panel workspace-home">
    <div class="workspace-home-shell">
      <section class="workspace-home-hero">
        <div class="workspace-home-hero-copy">
          <div class="workspace-home-kicker">{{ t('workspace.homeKicker') }}</div>
          <div class="workspace-home-heading">
            <h2 class="workspace-home-title">{{ t('workspace.homeTitle') }}</h2>
            <p class="workspace-home-body">{{ t('workspace.homeBody') }}</p>
          </div>
        </div>

        <div class="workspace-home-hero-side">
          <div class="workspace-home-user-card">
            <span class="workspace-home-user-label">{{ t('settings.profile') }}</span>
            <strong class="workspace-home-user-name">{{ userName }}</strong>
            <span class="workspace-home-user-meta">{{ latestUpdateDescription }}</span>
          </div>

          <div class="workspace-home-actions">
            <Button icon="pi pi-plus" :label="t('notes.newNoteAction')" @click="emit('create-note')" />
            <Button
              icon="pi pi-folder-plus"
              severity="secondary"
              outlined
              :label="t('sidebar.createFolder')"
              @click="emit('create-folder')"
            />
            <Button
              icon="pi pi-users"
              severity="secondary"
              outlined
              :label="t('community.title')"
              @click="emit('open-community')"
            />
            <Button
              icon="pi pi-cog"
              severity="secondary"
              outlined
              :label="t('settings.title')"
              @click="emit('open-settings')"
            />
          </div>
        </div>
      </section>

      <section class="workspace-home-overview">
        <article v-for="item in metrics" :key="item.id" class="workspace-home-metric-card">
          <span class="workspace-home-metric-label">{{ item.label }}</span>
          <strong class="workspace-home-metric-value">{{ item.value }}</strong>
        </article>

        <article class="workspace-home-storage-card">
          <div class="workspace-home-storage-header">
            <div>
              <span class="workspace-home-section-kicker">{{ t('storage.sidebarTitle') }}</span>
              <strong class="workspace-home-storage-copy">{{ storageDescription }}</strong>
            </div>
            <strong class="workspace-home-storage-percent">{{ storagePercent }}%</strong>
          </div>
          <ProgressBar :value="storagePercent" :show-value="false" />
        </article>

        <article class="workspace-home-scope-card">
          <span class="workspace-home-section-kicker">{{ t('workspace.homeCurrentScope') }}</span>
          <strong class="workspace-home-scope-value">{{ activeFolderName }}</strong>
          <span class="workspace-home-scope-hint">{{ t('notes.scopeFolder', { name: activeFolderName }) }}</span>
        </article>

        <article class="workspace-home-latest-card">
          <span class="workspace-home-section-kicker">{{ t('workspace.homeLatestUpdate') }}</span>
          <strong class="workspace-home-latest-title">{{ latestNoteTitle }}</strong>
          <span class="workspace-home-latest-time">{{ latestNoteTime }}</span>
        </article>
      </section>

      <div class="workspace-home-content">
        <section class="workspace-home-panel workspace-home-panel-wide">
          <div class="workspace-home-panel-header">
            <div>
              <span class="workspace-home-section-kicker">{{ t('workspace.homeRecentNotes') }}</span>
              <h3 class="workspace-home-panel-title">{{ t('workspace.homeRecentNotes') }}</h3>
              <p class="workspace-home-panel-body">{{ t('workspace.homeRecentNotesHint') }}</p>
            </div>
          </div>

          <div v-if="recentNotes.length" class="workspace-home-recent-list">
            <button
              v-for="note in recentNotes"
              :key="note.id"
              type="button"
              class="workspace-home-recent-item"
              @click="emitIfNoSelection('open-note', note.id)"
            >
              <div class="workspace-home-recent-main">
                <strong class="workspace-home-recent-title">{{ note.title || t('notes.untitled') }}</strong>
                <span class="workspace-home-recent-summary">{{ note.summary || t('notes.emptySummary') }}</span>
              </div>
              <div class="workspace-home-recent-meta">
                <span>{{ note.primaryLanguage || 'Markdown' }}</span>
                <span>{{ formatTime(note.updatedAt || note.createdAt) }}</span>
              </div>
            </button>
          </div>
          <div v-else class="workspace-home-empty">
            <i class="pi pi-file-edit workspace-home-empty-icon" aria-hidden="true" />
            <p class="workspace-home-empty-copy">{{ t('workspace.homeRecentNotesEmpty') }}</p>
          </div>
        </section>

        <div class="workspace-home-side-column">
          <section class="workspace-home-panel workspace-home-time-panel">
            <div class="workspace-home-panel-header">
              <div>
                <span class="workspace-home-section-kicker">{{ t('workspace.homeClockCalendar') }}</span>
                <h3 class="workspace-home-panel-title">{{ t('workspace.homeClockCalendarTitle') }}</h3>
                <p class="workspace-home-panel-body">{{ t('workspace.homeClockCalendarBody') }}</p>
              </div>
            </div>

            <div class="workspace-home-time-card">
              <div class="workspace-home-time-main">
                <span class="workspace-home-time-label">{{ t('workspace.homeCurrentTime') }}</span>
                <strong class="workspace-home-time-value">{{ currentTimeText }}</strong>
                <span class="workspace-home-time-date">{{ currentDateText }}</span>
              </div>

              <div class="workspace-home-time-meta">
                <span class="workspace-home-time-chip">{{ currentWeekdayText }}</span>
                <span class="workspace-home-time-chip">{{ t('workspace.homeTimezoneLabel') }} · {{ currentTimeZoneLabel }}</span>
              </div>
            </div>

            <div class="workspace-home-calendar">
              <div class="workspace-home-calendar-header">
                <div>
                  <span class="workspace-home-section-kicker">{{ t('workspace.homeCalendar') }}</span>
                  <strong class="workspace-home-calendar-month">{{ currentMonthLabel }}</strong>
                </div>
                <span class="workspace-home-calendar-today">{{ t('workspace.homeTodayLabel') }} · {{ currentDayLabel }}</span>
              </div>

              <div class="workspace-home-calendar-weekdays">
                <span
                  v-for="weekday in calendarWeekdays"
                  :key="weekday"
                  class="workspace-home-calendar-weekday"
                >
                  {{ weekday }}
                </span>
              </div>

              <div class="workspace-home-calendar-grid">
                <div
                  v-for="day in calendarDays"
                  :key="day.key"
                  class="workspace-home-calendar-cell"
                  :class="{
                    'workspace-home-calendar-cell-muted': !day.isCurrentMonth,
                    'workspace-home-calendar-cell-today': day.isToday,
                  }"
                  :aria-current="day.isToday ? 'date' : undefined"
                >
                  {{ day.label }}
                </div>
              </div>
            </div>
          </section>

          <section class="workspace-home-panel">
            <div class="workspace-home-panel-header">
              <div>
                <span class="workspace-home-section-kicker">{{ t('workspace.homeQuickStart') }}</span>
                <h3 class="workspace-home-panel-title">{{ t('workspace.homeQuickStart') }}</h3>
                <p class="workspace-home-panel-body">{{ t('workspace.homeQuickStartBody') }}</p>
              </div>
            </div>

            <div class="workspace-home-shortcut-list">
              <button type="button" class="workspace-home-shortcut" @click="emitIfNoSelection('create-note')">
                <span class="workspace-home-shortcut-icon"><i class="pi pi-file-edit" aria-hidden="true" /></span>
                <span class="workspace-home-shortcut-copy">
                  <strong>{{ t('notes.newNoteAction') }}</strong>
                  <span>{{ t('workspace.homeShortcutNote') }}</span>
                </span>
              </button>

              <button type="button" class="workspace-home-shortcut" @click="emitIfNoSelection('create-folder')">
                <span class="workspace-home-shortcut-icon"><i class="pi pi-folder-open" aria-hidden="true" /></span>
                <span class="workspace-home-shortcut-copy">
                  <strong>{{ t('sidebar.createFolder') }}</strong>
                  <span>{{ t('workspace.homeShortcutFolder') }}</span>
                </span>
              </button>

              <button type="button" class="workspace-home-shortcut" @click="emitIfNoSelection('open-community')">
                <span class="workspace-home-shortcut-icon"><i class="pi pi-users" aria-hidden="true" /></span>
                <span class="workspace-home-shortcut-copy">
                  <strong>{{ t('community.title') }}</strong>
                  <span>{{ t('workspace.homeShortcutCommunity') }}</span>
                </span>
              </button>

              <button type="button" class="workspace-home-shortcut" @click="emitIfNoSelection('open-settings')">
                <span class="workspace-home-shortcut-icon"><i class="pi pi-cog" aria-hidden="true" /></span>
                <span class="workspace-home-shortcut-copy">
                  <strong>{{ t('settings.title') }}</strong>
                  <span>{{ t('workspace.homeShortcutSettings') }}</span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  recentNotes: {
    type: Array,
    default: () => [],
  },
  folders: {
    type: Array,
    default: () => [],
  },
  metrics: {
    type: Array,
    default: () => [],
  },
  storageProfile: {
    type: Object,
    default: null,
  },
  storagePercent: {
    type: Number,
    default: 0,
  },
  activeFolderName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['create-note', 'create-folder', 'open-community', 'open-settings', 'open-note']);
const { locale, t } = useI18n();
const LIVE_CLOCK_INTERVAL = 1000;
const currentDateTime = ref(new Date());
let liveClockTimer = null;

function formatBytes(value) {
  const numericValue = Number(value || 0);

  if (!numericValue) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let size = numericValue;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function resolveLocaleCode() {
  return locale.value === 'zh' ? 'zh-CN' : 'en-US';
}

function resolveCalendarWeekStart() {
  return locale.value === 'zh' ? 1 : 0;
}

function formatCurrentClock(value) {
  return new Intl.DateTimeFormat(resolveLocaleCode(), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(value);
}

function formatCurrentDate(value) {
  return new Intl.DateTimeFormat(resolveLocaleCode(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(value);
}

function formatCurrentWeekday(value) {
  return new Intl.DateTimeFormat(resolveLocaleCode(), {
    weekday: 'long',
  }).format(value);
}

function formatCurrentMonth(value) {
  return new Intl.DateTimeFormat(resolveLocaleCode(), {
    year: 'numeric',
    month: 'long',
  }).format(value);
}

function formatCurrentDay(value) {
  return new Intl.DateTimeFormat(resolveLocaleCode(), {
    month: 'short',
    day: 'numeric',
  }).format(value);
}

function toDateKey(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function tickCurrentDateTime() {
  currentDateTime.value = new Date();
}

function hasActiveTextSelection() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.getSelection?.()?.toString().trim());
}

function emitIfNoSelection(eventName, ...args) {
  if (hasActiveTextSelection()) {
    return;
  }

  emit(eventName, ...args);
}

const userName = computed(() => props.user?.nickname || props.user?.email || t('app.name'));
const latestNote = computed(() => props.recentNotes[0] || null);
const latestNoteTitle = computed(() => latestNote.value?.title || t('workspace.homeLatestUpdateEmpty'));
const latestNoteTime = computed(() => (
  latestNote.value ? formatTime(latestNote.value.updatedAt || latestNote.value.createdAt) : t('workspace.homeLatestUpdateEmpty')
));
const latestUpdateDescription = computed(() => (
  latestNote.value
    ? `${t('workspace.homeLatestUpdate')} · ${formatTime(latestNote.value.updatedAt || latestNote.value.createdAt)}`
    : t('workspace.homeLatestUpdateEmpty')
));
const storageDescription = computed(() => {
  if (!props.storageProfile?.storageLimit) {
    return t('storage.noLimit');
  }

  return t('storage.usedOf', {
    used: formatBytes(props.storageProfile.storageUsed),
    limit: formatBytes(props.storageProfile.storageLimit),
  });
});
const currentTimeText = computed(() => formatCurrentClock(currentDateTime.value));
const currentDateText = computed(() => formatCurrentDate(currentDateTime.value));
const currentWeekdayText = computed(() => formatCurrentWeekday(currentDateTime.value));
const currentMonthLabel = computed(() => formatCurrentMonth(currentDateTime.value));
const currentDayLabel = computed(() => formatCurrentDay(currentDateTime.value));
const currentTimeZoneLabel = computed(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local');
const todayKey = computed(() => toDateKey(currentDateTime.value));
const calendarWeekdays = computed(() => {
  const weekStart = resolveCalendarWeekStart();
  const referenceSunday = new Date(2024, 0, 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(referenceSunday);
    date.setDate(referenceSunday.getDate() + weekStart + index);
    return new Intl.DateTimeFormat(resolveLocaleCode(), { weekday: 'short' }).format(date);
  });
});
const calendarDays = computed(() => {
  const year = currentDateTime.value.getFullYear();
  const month = currentDateTime.value.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const weekStart = resolveCalendarWeekStart();
  const leadingDays = (monthStart.getDay() - weekStart + 7) % 7;
  const trailingDays = (weekStart + 6 - monthEnd.getDay() + 7) % 7;
  const gridStart = new Date(year, month, 1 - leadingDays);
  const totalDays = leadingDays + monthEnd.getDate() + trailingDays;

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      key: toDateKey(date),
      label: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: toDateKey(date) === todayKey.value,
    };
  });
});

onMounted(() => {
  tickCurrentDateTime();

  if (typeof window !== 'undefined') {
    liveClockTimer = window.setInterval(tickCurrentDateTime, LIVE_CLOCK_INTERVAL);
  }
});

onBeforeUnmount(() => {
  if (liveClockTimer) {
    window.clearInterval(liveClockTimer);
    liveClockTimer = null;
  }
});
</script>

<style scoped>
.workspace-home {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  overflow: hidden;
  background: transparent;
}

.workspace-home-shell {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  padding: 1.2rem;
  display: grid;
  gap: 0.75rem;
  grid-template-rows: auto auto minmax(0, 1fr);
  overflow: hidden;
}

.workspace-home-hero,
.workspace-home-metric-card,
.workspace-home-storage-card,
.workspace-home-scope-card,
.workspace-home-latest-card,
.workspace-home-panel,
.workspace-home-user-card,
.workspace-home-shortcut {
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-strong) 98%, transparent);
}

.workspace-home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(18rem, 0.95fr);
  align-items: start;
  gap: 0.85rem;
  padding: 1rem 1.05rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 11%, var(--app-panel-strong)), color-mix(in srgb, var(--app-panel-strong) 98%, transparent));
}

.workspace-home-hero-copy,
.workspace-home-heading,
.workspace-home-hero-side,
.workspace-home-side-column,
.workspace-home-user-card,
.workspace-home-metric-card,
.workspace-home-storage-card,
.workspace-home-scope-card,
.workspace-home-latest-card,
.workspace-home-time-main,
.workspace-home-shortcut-copy,
.workspace-home-recent-main {
  display: flex;
  flex-direction: column;
}

.workspace-home-hero-copy,
.workspace-home-hero-side {
  gap: 0.8rem;
}

.workspace-home-heading {
  gap: 0.45rem;
}

.workspace-home-kicker,
.workspace-home-section-kicker,
.workspace-home-user-label,
.workspace-home-metric-label,
.workspace-home-recent-meta,
.workspace-home-shortcut-copy span {
  font-family: var(--font-mono);
  font-size: 0.78rem;
}

.workspace-home-kicker,
.workspace-home-section-kicker {
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.workspace-home-title,
.workspace-home-panel-title {
  margin: 0;
  color: var(--text-color);
  letter-spacing: -0.04em;
}

.workspace-home-title {
  font-size: clamp(1.8rem, 3vw, 2.45rem);
  line-height: 1.02;
}

.workspace-home-body,
.workspace-home-panel-body,
.workspace-home-empty-copy,
.workspace-home-recent-summary,
.workspace-home-scope-hint,
.workspace-home-user-meta,
.workspace-home-latest-time {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.workspace-home-body,
.workspace-home-panel-body {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.workspace-home-user-card {
  gap: 0.35rem;
  padding: 0.8rem 0.9rem;
}

.workspace-home-user-label,
.workspace-home-metric-label,
.workspace-home-recent-meta,
.workspace-home-shortcut-copy span,
.workspace-home-scope-hint,
.workspace-home-user-meta,
.workspace-home-latest-time {
  color: var(--text-color-secondary);
}

.workspace-home-user-name,
.workspace-home-metric-value,
.workspace-home-storage-copy,
.workspace-home-scope-value,
.workspace-home-latest-title,
.workspace-home-recent-title,
.workspace-home-shortcut-copy strong {
  color: var(--text-color);
}

.workspace-home-user-name,
.workspace-home-storage-copy,
.workspace-home-scope-value,
.workspace-home-latest-title {
  font-size: 1rem;
  font-weight: 700;
}

.workspace-home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.workspace-home-actions :deep(.p-button) {
  min-height: 2.5rem;
  padding-block: 0.45rem;
}

.workspace-home-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.workspace-home-metric-card,
.workspace-home-storage-card,
.workspace-home-scope-card,
.workspace-home-latest-card {
  padding: 0.8rem 0.9rem;
}

.workspace-home-panel {
  padding: 0.9rem;
}

.workspace-home-metric-card,
.workspace-home-scope-card,
.workspace-home-latest-card {
  gap: 0.25rem;
}

.workspace-home-storage-card {
  gap: 0.65rem;
}

.workspace-home-storage-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}

.workspace-home-storage-percent {
  color: var(--primary-color);
  font-size: 1rem;
  line-height: 1;
}

.workspace-home-content {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(20rem, 0.9fr);
  min-height: 0;
  gap: 0.75rem;
}

.workspace-home-side-column {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  gap: 0.75rem;
}

.workspace-home-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
}

.workspace-home-panel-wide {
  min-height: 0;
}

.workspace-home-time-panel {
  gap: 0.75rem;
}

.workspace-home-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.workspace-home-panel-body {
  margin-top: 0.2rem;
}

.workspace-home-time-card,
.workspace-home-calendar {
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.workspace-home-time-card {
  padding: 0.85rem;
  display: grid;
  gap: 0.75rem;
  background: color-mix(in srgb, var(--primary-color) 8%, var(--app-panel-strong));
}

.workspace-home-time-main {
  gap: 0.35rem;
}

.workspace-home-time-label,
.workspace-home-time-chip,
.workspace-home-calendar-weekday,
.workspace-home-calendar-today {
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

.workspace-home-time-label {
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.workspace-home-time-value {
  color: var(--text-color);
  font-family: var(--font-mono);
  font-size: clamp(1.8rem, 4vw, 2.35rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.08em;
  font-variant-numeric: tabular-nums;
}

.workspace-home-time-date {
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.workspace-home-time-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.workspace-home-time-chip,
.workspace-home-calendar-today {
  display: inline-flex;
  align-items: center;
  min-height: 1.85rem;
  padding: 0 0.6rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  background: color-mix(in srgb, var(--app-panel-strong) 96%, transparent);
  color: var(--text-color-secondary);
}

.workspace-home-calendar {
  padding: 0.75rem;
  display: grid;
  gap: 0.55rem;
}

.workspace-home-calendar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
}

.workspace-home-calendar-month {
  display: block;
  margin-top: 0.15rem;
  color: var(--text-color);
  font-size: 0.96rem;
  font-weight: 700;
}

.workspace-home-calendar-weekdays,
.workspace-home-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.workspace-home-calendar-weekdays {
  gap: 0.25rem;
}

.workspace-home-calendar-weekday {
  color: var(--text-color-secondary);
  text-align: center;
}

.workspace-home-calendar-grid {
  gap: 0.25rem;
}

.workspace-home-calendar-cell {
  min-height: 0;
  height: clamp(1.9rem, 2.05vw, 2.2rem);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: color-mix(in srgb, var(--app-panel-strong) 92%, transparent);
  color: var(--text-color);
  font-size: 0.84rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.workspace-home-calendar-cell-muted {
  color: color-mix(in srgb, var(--text-color-secondary) 80%, transparent);
  background: transparent;
}

.workspace-home-calendar-cell-today {
  border-color: color-mix(in srgb, var(--primary-color) 34%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 12%, var(--app-panel-strong));
  color: var(--primary-color);
}

.workspace-home-recent-list,
.workspace-home-shortcut-list {
  display: grid;
  gap: 0.65rem;
}

.workspace-home-recent-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  align-content: start;
  padding-right: 0.1rem;
}

.workspace-home-shortcut-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 0;
}

.workspace-home-recent-item,
.workspace-home-shortcut {
  width: 100%;
  padding: 0.8rem 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease;
  user-select: text;
  -webkit-user-select: text;
}

.workspace-home-recent-item {
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.workspace-home-recent-item:hover,
.workspace-home-shortcut:hover {
  border-color: color-mix(in srgb, var(--primary-color) 30%, var(--app-border));
  background: color-mix(in srgb, var(--primary-color) 7%, var(--app-panel-subtle));
  transform: translateY(-1px);
}

.workspace-home-recent-main {
  min-width: 0;
  gap: 0.22rem;
  flex: 1;
  user-select: text;
  -webkit-user-select: text;
}

.workspace-home-recent-summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.workspace-home-recent-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
  text-align: right;
  user-select: text;
  -webkit-user-select: text;
}

.workspace-home-shortcut {
  border-radius: 0;
  align-items: flex-start;
  justify-content: flex-start;
  background: color-mix(in srgb, var(--app-panel-subtle) 94%, transparent);
}

.workspace-home-shortcut-icon {
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--primary-color) 18%, var(--app-border));
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
}

.workspace-home-shortcut-copy {
  min-width: 0;
  gap: 0.18rem;
  flex: 1;
  user-select: text;
  -webkit-user-select: text;
}

.workspace-home-shortcut-copy span {
  display: -webkit-box;
  overflow: hidden;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.workspace-home-empty {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  border: 1px dashed var(--app-border);
  background: color-mix(in srgb, var(--app-panel-subtle) 88%, transparent);
}

.workspace-home-empty-icon {
  font-size: 1.4rem;
  color: var(--primary-color);
}

@media (max-width: 1200px) {
  .workspace-home-overview,
  .workspace-home-content {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-home-hero {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 980px) {
  .workspace-home {
    overflow: auto;
  }

  .workspace-home-shell {
    height: auto;
    min-height: 100%;
    padding: 1rem;
    grid-template-rows: auto;
    overflow: visible;
  }

  .workspace-home-hero,
  .workspace-home-overview,
  .workspace-home-content {
    grid-template-columns: 1fr;
  }

  .workspace-home-side-column {
    grid-template-rows: auto;
  }

  .workspace-home-actions {
    gap: 0.55rem;
  }

  .workspace-home-recent-list {
    overflow: visible;
  }

  .workspace-home-recent-item,
  .workspace-home-shortcut {
    align-items: flex-start;
  }

  .workspace-home-shortcut-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-home-recent-meta {
    align-items: flex-start;
    text-align: left;
  }
}

@media (max-width: 640px) {
  .workspace-home-title {
    font-size: clamp(1.7rem, 10vw, 2.3rem);
  }

  .workspace-home-hero,
  .workspace-home-metric-card,
  .workspace-home-storage-card,
  .workspace-home-scope-card,
  .workspace-home-latest-card,
  .workspace-home-panel,
  .workspace-home-user-card,
  .workspace-home-time-card,
  .workspace-home-calendar,
  .workspace-home-recent-item,
  .workspace-home-shortcut {
    padding: 0.9rem;
  }

  .workspace-home-actions :deep(.p-button) {
    width: 100%;
    justify-content: center;
  }

  .workspace-home-recent-item,
  .workspace-home-shortcut {
    flex-direction: column;
  }

  .workspace-home-shortcut-list {
    grid-template-columns: 1fr;
  }

  .workspace-home-time-value {
    font-size: clamp(1.85rem, 11vw, 2.45rem);
  }

  .workspace-home-calendar-header {
    flex-direction: column;
  }
}
</style>
