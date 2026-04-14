import { Button, Chip, Dialog, Spinner, TextArea } from 'heroui-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';

import { sandboxApi } from '../../api';
import { useDeviceType } from '../../hooks';
import { useAppTheme } from '../../theme';
import {
  DEFAULT_CODE_FONT_SIZE,
  formatSandboxDuration,
  formatSandboxMemory,
  getSandboxStderr,
  getSandboxStdout,
  getStoredCodeFontSize,
  resolveSandboxRunnerStatus,
} from '../../utils';
import type { RunCodeResponse } from '../../types';
import { GlassPanel } from '../common/AppChrome';
import {
  APP_FADE_IN,
  APP_FADE_OUT,
  APP_LAYOUT_TRANSITION,
  APP_PANEL_ENTERING,
  APP_PANEL_EXITING,
} from '../common/AppMotion';

export type RunnerStatus = 'idle' | 'running' | 'success' | 'error' | 'timeout';

export interface CodeRunnerPanelProps {
  isOpen: boolean;
  language: string;
  sourceCode: string;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (status: RunnerStatus) => void;
  preferCompactLayout?: boolean;
}

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

function normalizeRunnerLanguage(language: string): string | null {
  const normalizedLanguage = language.trim().toLowerCase();
  return RUNNABLE_LANGUAGE_MAP[normalizedLanguage] ?? null;
}

function getStatusLabel(status: RunnerStatus): string {
  switch (status) {
    case 'running':
      return 'Running';
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'timeout':
      return 'Timeout';
    default:
      return 'Idle';
  }
}

function getStatusColor(status: RunnerStatus): 'default' | 'success' | 'danger' | 'warning' | 'accent' {
  switch (status) {
    case 'running':
      return 'accent';
    case 'success':
      return 'success';
    case 'timeout':
      return 'warning';
    case 'error':
      return 'danger';
    default:
      return 'default';
  }
}

export function CodeRunnerPanel({
  isOpen,
  language,
  sourceCode,
  onOpenChange,
  onStatusChange,
  preferCompactLayout = false,
}: CodeRunnerPanelProps) {
  const { showSidebar } = useDeviceType();
  const { typography } = useAppTheme();
  const { height: screenHeight } = useWindowDimensions();
  const useCompactLayout = preferCompactLayout || !showSidebar;
  const mobilePanelHeight = Math.max(520, Math.floor(screenHeight * 0.8));

  const [stdinExpanded, setStdinExpanded] = useState(false);
  const [stdin, setStdin] = useState('');
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

  const resolvedLanguage = useMemo(() => normalizeRunnerLanguage(language), [language]);
  const stdout = getSandboxStdout(result);
  const stderr = getSandboxStderr(result);

  const handleRun = async () => {
    if (!resolvedLanguage) {
      setResult({
        stderr: `当前语言 ${language || '未设置'} 暂不支持运行，请切换到可执行语言后再试。`,
        status: 'ERROR',
      });
      setStatus('error');
      return;
    }

    if (sourceCode.trim().length === 0) {
      setResult({
        stderr: '当前笔记没有可执行的代码内容。',
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
        sourceCode,
        stdin: stdin.trim().length > 0 ? stdin : undefined,
      });

      setResult(nextResult);
      setStatus(resolveSandboxRunnerStatus(nextResult));
    } catch (error) {
      const message = getErrorMessage(error, '代码运行失败，请稍后重试。');
      const nextStatus: RunnerStatus = /timeout/i.test(message) ? 'timeout' : 'error';

      setResult({
        stderr: message,
        status: nextStatus === 'timeout' ? 'TIMEOUT' : 'ERROR',
      });
      setStatus(nextStatus);
    }
  };

  const renderPanelBody = () => (
    <View className="min-h-0 flex-1 gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className={`${typography.h3} text-foreground`}>代码运行</Text>
          <Text className={`${typography.bodySmall} mt-1 text-foreground/60`} numberOfLines={2}>
            当前语言：{resolvedLanguage ?? `${language || '未设置'}（暂不支持运行）`}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Chip color={getStatusColor(status)} size="sm" variant="soft">
            {getStatusLabel(status)}
          </Chip>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            关闭
          </Button>
        </View>
      </View>

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
              <Button.Label>运行中...</Button.Label>
            </>
          ) : (
            '▶ 运行'
          )}
        </Button>
        <Button variant="outline" onPress={() => setStdinExpanded(previous => !previous)}>
          {stdinExpanded ? '隐藏输入' : '显示输入'}
        </Button>
      </View>

      {stdinExpanded ? (
        <Animated.View layout={APP_LAYOUT_TRANSITION} className="rounded-[10px] bg-background px-4 py-4">
          <Text className={`${typography.bodySmall} mb-3 text-foreground/60`}>
            stdin
          </Text>
          <TextArea
            numberOfLines={4}
            placeholder="可选，输入运行时标准输入内容"
            value={stdin}
            onChangeText={setStdin}
          />
        </Animated.View>
      ) : null}

      <View className="flex-row items-center gap-3 rounded-2xl bg-background px-4 py-3">
        <Text className={`${typography.bodySmall} text-foreground/60`}>
          运行时间：{formatSandboxDuration(result)}
        </Text>
        <Text className={`${typography.bodySmall} text-foreground/60`}>
          内存占用：{formatSandboxMemory(result)}
        </Text>
      </View>

      <View className="min-h-0 flex-1 rounded-[10px] bg-background px-4 py-4">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {stdout ? (
            <View className="mb-4">
              <Text className={`${typography.bodySmall} mb-2 text-success`}>
                stdout
              </Text>
              <Text className={`${typography.code} text-success`} style={{ fontSize }}>
                {stdout}
              </Text>
            </View>
          ) : null}

          {stderr ? (
            <View className="mb-4">
              <Text className={`${typography.bodySmall} mb-2 text-danger`}>
                stderr
              </Text>
              <Text className={`${typography.code} text-danger`} style={{ fontSize }}>
                {stderr}
              </Text>
            </View>
          ) : null}

          {!stdout && !stderr ? (
            <Text className={`${typography.body} text-foreground/55`}>
              {status === 'success' ? '运行完成，当前代码没有输出。' : '点击“运行”后，输出会显示在这里。'}
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );

  if (!isOpen) {
    return null;
  }

  if (!useCompactLayout) {
    return (
      <Animated.View
        entering={APP_FADE_IN}
        exiting={APP_FADE_OUT}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 20,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}>
        <Pressable className="flex-1 bg-black/10" onPress={() => onOpenChange(false)} />
        <Animated.View
          entering={APP_PANEL_ENTERING}
          exiting={APP_PANEL_EXITING}
          layout={APP_LAYOUT_TRANSITION}
          style={{ width: 360 }}>
          <View className="border-l border-default-200 bg-content1 px-5 py-5 shadow-2xl">
            {renderPanelBody()}
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          className="mt-auto rounded-b-none rounded-t-3xl p-0"
          style={{ backgroundColor: 'transparent', height: mobilePanelHeight }}>
          <GlassPanel
            className="min-h-0 flex-1 rounded-b-none rounded-t-3xl px-5 py-5"
            variant="strong">
            {renderPanelBody()}
          </GlassPanel>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
