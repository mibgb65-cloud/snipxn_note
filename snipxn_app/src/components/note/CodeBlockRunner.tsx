import { Button, Chip, Spinner } from 'heroui-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { sandboxApi } from '../../api';
import { useI18n } from '../../i18n';
import { useAppTheme, withAlpha } from '../../theme';
import { extractCodeBlocks, type CodeBlock } from '../../utils/codeBlocks';
import { DEFAULT_CODE_FONT_SIZE, getStoredCodeFontSize } from '../../utils/preferences';
import type { RunCodeResponse } from '../../types';
import { AppIcon } from '../common/AppIcon';
import { GlassPanel } from '../common/AppChrome';
import { MotionPressable } from '../common/AppMotion';
import type { RunnerStatus } from './CodeRunnerPanel';

const RUNNABLE_LANGUAGE_MAP: Record<string, string> = {
  bash: 'bash',
  cpp: 'cpp',
  go: 'go',
  java: 'java',
  javascript: 'javascript',
  js: 'javascript',
  kotlin: 'kotlin',
  py: 'python',
  python: 'python',
  rust: 'rust',
  sql: 'sql',
  ts: 'typescript',
  typescript: 'typescript',
};

function normalizeRunnerLanguage(language: string): string | null {
  return RUNNABLE_LANGUAGE_MAP[language.trim().toLowerCase()] ?? null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}

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

function formatDuration(response: RunCodeResponse | null): string {
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

  return pickString(response, ['executionTime', 'duration', 'runtime']) ?? '--';
}

function formatMemory(response: RunCodeResponse | null): string {
  if (!response) {
    return '--';
  }

  const memoryBytes = pickNumber(response, ['memoryBytes', 'memoryUsedBytes']);
  if (memoryBytes !== null) {
    return formatBytes(memoryBytes);
  }

  const memoryKb = pickNumber(response, ['memoryKb', 'memoryKB', 'memoryUsedKb']);
  if (memoryKb !== null) {
    return `${memoryKb} KB`;
  }

  const memoryMb = pickNumber(response, ['memoryMb', 'memoryMB', 'memoryUsedMb']);
  if (memoryMb !== null) {
    return `${memoryMb} MB`;
  }

  return pickString(response, ['memory', 'memoryUsed']) ?? '--';
}

function resolveRunnerStatus(response: RunCodeResponse): RunnerStatus {
  const status = typeof response.status === 'string' ? response.status.toLowerCase() : '';

  if (status.includes('timeout')) {
    return 'timeout';
  }

  if (status.includes('error') || status.includes('fail')) {
    return 'error';
  }

  if (typeof response.stderr === 'string' && response.stderr.trim().length > 0) {
    return 'error';
  }

  return 'success';
}

export interface CodeBlockRunnerProps {
  content: string;
  documentLanguage: string;
  onClose: () => void;
  onScrollToLine?: (line: number) => void;
  onStatusChange?: (status: RunnerStatus) => void;
}

export function CodeBlockRunner({
  content,
  documentLanguage,
  onClose,
  onScrollToLine,
  onStatusChange,
}: CodeBlockRunnerProps) {
  const { palette, typography } = useAppTheme();
  const { t } = useI18n();

  const blocks = useMemo(
    () => extractCodeBlocks(content, documentLanguage),
    [content, documentLanguage],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<RunnerStatus>('idle');
  const [result, setResult] = useState<RunCodeResponse | null>(null);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_CODE_FONT_SIZE);

  useEffect(() => {
    let isMounted = true;
    void getStoredCodeFontSize().then(value => {
      if (isMounted) {
        setFontSize(value);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  // Clamp index if blocks change
  useEffect(() => {
    if (blocks.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= blocks.length) {
      setCurrentIndex(blocks.length - 1);
    }
  }, [blocks.length, currentIndex]);

  const currentBlock: CodeBlock | null = blocks.length > 0 ? blocks[currentIndex] ?? null : null;

  const navigateToBlock = (index: number) => {
    setCurrentIndex(index);
    setStatus('idle');
    setResult(null);

    const block = blocks[index];
    if (block) {
      onScrollToLine?.(block.startLine);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      navigateToBlock(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < blocks.length - 1) {
      navigateToBlock(currentIndex + 1);
    }
  };

  const handleRun = async () => {
    if (!currentBlock) {
      return;
    }

    const resolvedLanguage = normalizeRunnerLanguage(currentBlock.language);

    if (!resolvedLanguage) {
      setResult({
        stderr: t('当前语言暂不支持运行') + `: ${currentBlock.language}`,
        status: 'ERROR',
      });
      setStatus('error');
      return;
    }

    if (currentBlock.code.trim().length === 0) {
      setResult({
        stderr: t('代码块内容为空'),
        status: 'ERROR',
      });
      setStatus('error');
      return;
    }

    setStatus('running');
    setResult(null);

    try {
      const nextResult = await sandboxApi.runCode({
        language: resolvedLanguage,
        sourceCode: currentBlock.code,
      });

      setResult(nextResult);
      setStatus(resolveRunnerStatus(nextResult));
    } catch (error) {
      const message = getErrorMessage(error, t('代码运行失败'));
      const nextStatus: RunnerStatus = /timeout/i.test(message) ? 'timeout' : 'error';

      setResult({
        stderr: message,
        status: nextStatus === 'timeout' ? 'TIMEOUT' : 'ERROR',
      });
      setStatus(nextStatus);
    }
  };

  const stdout = typeof result?.stdout === 'string' ? result.stdout.trim() : '';
  const stderr = typeof result?.stderr === 'string' ? result.stderr.trim() : '';

  return (
    <GlassPanel className="flex-1 px-4 py-4" variant="strong">
      <View className="flex-1 gap-3">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className={typography.h3} style={{ color: palette.text }}>
            {t('代码运行')}
          </Text>
          <MotionPressable
            accessibilityLabel={t('关闭')}
            accessibilityRole="button"
            className="rounded-full p-1.5"
            onPress={onClose}
            style={{ backgroundColor: withAlpha(palette.textMuted, 0.12) }}>
            <AppIcon color={palette.textMuted} name="x" size={16} />
          </MotionPressable>
        </View>

        {/* Block navigation */}
        {blocks.length > 0 ? (
          <View className="flex-row items-center justify-between gap-2">
            <MotionPressable
              accessibilityRole="button"
              className="rounded-full p-1.5"
              disabled={currentIndex === 0}
              onPress={handlePrev}
              style={{
                opacity: currentIndex === 0 ? 0.35 : 1,
                backgroundColor: withAlpha(palette.primary, 0.1),
              }}>
              <AppIcon color={palette.primary} name="chevron-left" size={18} />
            </MotionPressable>

            <View className="flex-1 items-center">
              <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                {t('代码块')} {currentIndex + 1} / {blocks.length}
              </Text>
              {currentBlock ? (
                <Text className={typography.caption} style={{ color: palette.textMuted }}>
                  {currentBlock.language} · L{currentBlock.startLine}–{currentBlock.endLine}
                </Text>
              ) : null}
            </View>

            <MotionPressable
              accessibilityRole="button"
              className="rounded-full p-1.5"
              disabled={currentIndex >= blocks.length - 1}
              onPress={handleNext}
              style={{
                opacity: currentIndex >= blocks.length - 1 ? 0.35 : 1,
                backgroundColor: withAlpha(palette.primary, 0.1),
              }}>
              <AppIcon color={palette.primary} name="chevron-right" size={18} />
            </MotionPressable>
          </View>
        ) : (
          <View className="items-center rounded-[10px] px-4 py-6" style={{ backgroundColor: palette.panelInset }}>
            <Text className={typography.body} style={{ color: palette.textSoft }}>
              {t('未找到代码块')}
            </Text>
          </View>
        )}

        {/* Code preview */}
        {currentBlock ? (
          <View
            className="max-h-32 rounded-[10px] px-3 py-3"
            style={{ backgroundColor: palette.panelInset }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className={typography.code} style={{ color: palette.text, fontSize }} numberOfLines={8}>
                {currentBlock.code}
              </Text>
            </ScrollView>
          </View>
        ) : null}

        {/* Run button + status */}
        {currentBlock ? (
          <View className="flex-row items-center gap-3">
            <Button
              isDisabled={status === 'running'}
              variant="primary"
              onPress={() => {
                void handleRun();
              }}>
              {status === 'running' ? (
                <>
                  <Spinner color="default" size="sm" />
                  <Button.Label>{t('运行中')}</Button.Label>
                </>
              ) : (
                t('运行')
              )}
            </Button>
            {status !== 'idle' ? (
              <Chip
                color={
                  status === 'success'
                    ? 'success'
                    : status === 'running'
                      ? 'accent'
                      : status === 'timeout'
                        ? 'warning'
                        : 'danger'
                }
                size="sm"
                variant="soft">
                {status === 'running'
                  ? t('运行中')
                  : status === 'success'
                    ? t('运行成功')
                    : status === 'timeout'
                      ? t('运行超时')
                      : t('运行失败')}
              </Chip>
            ) : null}
          </View>
        ) : null}

        {/* Stats */}
        {result ? (
          <View className="flex-row items-center gap-3 rounded-2xl px-3 py-2" style={{ backgroundColor: palette.panelInset }}>
            <Text className={typography.caption} style={{ color: palette.textSoft }}>
              {t('运行时间')}：{formatDuration(result)}
            </Text>
            <Text className={typography.caption} style={{ color: palette.textSoft }}>
              {t('内存占用')}：{formatMemory(result)}
            </Text>
          </View>
        ) : null}

        {/* Output */}
        <View className="min-h-0 flex-1 rounded-[10px] px-3 py-3" style={{ backgroundColor: palette.panelInset }}>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {stdout ? (
              <View className="mb-3">
                <Text className={typography.caption} style={{ color: palette.success, marginBottom: 4 }}>
                  stdout
                </Text>
                <Text className={typography.code} style={{ color: palette.success, fontSize }}>
                  {stdout}
                </Text>
              </View>
            ) : null}

            {stderr ? (
              <View className="mb-3">
                <Text className={typography.caption} style={{ color: palette.danger, marginBottom: 4 }}>
                  stderr
                </Text>
                <Text className={typography.code} style={{ color: palette.danger, fontSize }}>
                  {stderr}
                </Text>
              </View>
            ) : null}

            {!stdout && !stderr ? (
              <Text className={typography.body} style={{ color: palette.textMuted }}>
                {t('运行输出将显示在这里')}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </GlassPanel>
  );
}
