import { Button, Chip, Dialog, Spinner, TextArea } from 'heroui-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { aiApi } from '../../api';
import { useDeviceType } from '../../hooks';
import { useAppTheme } from '../../theme';
import type { AiResponse } from '../../types';
import { DEFAULT_CODE_FONT_SIZE, getStoredCodeFontSize } from '../../utils';
import { AppIcon } from '../common/AppIcon';
import { GlassPanel } from '../common/AppChrome';

export interface AiPanelProps {
  isOpen: boolean;
  currentContent: string;
  currentLanguage: string;
  onOpenChange: (open: boolean) => void;
  onInsertGenerated: (content: string) => void;
  onBusyChange?: (busy: boolean) => void;
  inline?: boolean;
}

type AiTab = 'review' | 'generate';

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

export function AiPanel({
  isOpen,
  currentContent,
  currentLanguage,
  onOpenChange,
  onInsertGenerated,
  onBusyChange,
  inline,
}: AiPanelProps) {
  const { screenHeight } = useDeviceType();
  const { palette, theme, typography } = useAppTheme();

  const [activeTab, setActiveTab] = useState<AiTab>('review');
  const [reviewFocus, setReviewFocus] = useState('请从潜在 bug、边界条件、可读性和性能优化角度审查当前代码。');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<AiResponse | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<AiResponse | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
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

  const isBusy = reviewLoading || generateLoading;
  const mobilePanelHeight = Math.max(560, Math.floor(screenHeight * 0.82));

  useEffect(() => {
    onBusyChange?.(isBusy);
  }, [isBusy, onBusyChange]);

  const markdownStyle = useMemo(
    () => ({
      body: {
        color: theme === 'dark' ? '#F5F5F5' : '#18181B',
        fontSize: 15,
        lineHeight: 24,
      },
      heading1: {
        color: theme === 'dark' ? '#FAFAFA' : '#09090B',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
      },
      heading2: {
        color: theme === 'dark' ? '#FAFAFA' : '#09090B',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
      },
      heading3: {
        color: theme === 'dark' ? '#FAFAFA' : '#09090B',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 12,
      },
      bullet_list: {
        marginBottom: 12,
      },
      ordered_list: {
        marginBottom: 12,
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: theme === 'dark' ? '#52525B' : '#D4D4D8',
        color: theme === 'dark' ? '#D4D4D8' : '#52525B',
        paddingLeft: 12,
        marginBottom: 12,
      },
      code_inline: {
        backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F8F8F8',
        color: theme === 'dark' ? '#F4F4F5' : '#18181B',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
      },
      code_block: {
        backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F8F8F8',
        color: theme === 'dark' ? '#F4F4F5' : '#18181B',
        borderRadius: 14,
        padding: 14,
      },
      fence: {
        backgroundColor: theme === 'dark' ? '#2D2D2D' : '#F8F8F8',
        color: theme === 'dark' ? '#F4F4F5' : '#18181B',
        borderRadius: 14,
        padding: 14,
      },
      link: {
        color: theme === 'dark' ? '#60A5FA' : '#2563EB',
      },
    }),
    [theme],
  );

  const handleReview = async () => {
    if (currentContent.trim().length === 0) {
      setReviewError('当前笔记没有可分析的代码内容。');
      setReviewResult(null);
      return;
    }

    if (reviewFocus.trim().length === 0) {
      setReviewError('请输入审查重点或错误信息。');
      setReviewResult(null);
      return;
    }

    setReviewLoading(true);
    setReviewError(null);

    try {
      const result = await aiApi.review({
        code: currentContent,
        errorMessage: reviewFocus.trim(),
        language: currentLanguage,
      });
      setReviewResult(result);
    } catch (error) {
      setReviewError(getErrorMessage(error, '代码审查失败，请稍后重试。'));
      setReviewResult(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (generatePrompt.trim().length === 0) {
      setGenerateError('请输入生成需求。');
      setGeneratedResult(null);
      return;
    }

    setGenerateLoading(true);
    setGenerateError(null);

    try {
      const result = await aiApi.generate({
        description: generatePrompt.trim(),
        language: currentLanguage,
      });
      setGeneratedResult(result);
    } catch (error) {
      setGenerateError(getErrorMessage(error, '代码生成失败，请稍后重试。'));
      setGeneratedResult(null);
    } finally {
      setGenerateLoading(false);
    }
  };

  const renderResultMeta = (result: AiResponse) => {
    if (!result.model && result.totalTokens === null) {
      return null;
    }

    return (
      <View className="mb-3 flex-row flex-wrap gap-2">
        {result.model ? (
          <Chip color="accent" size="sm" variant="soft">
            {result.model}
          </Chip>
        ) : null}
        {result.totalTokens !== null ? (
          <Chip color="default" size="sm" variant="soft">
            Tokens {result.totalTokens}
          </Chip>
        ) : null}
      </View>
    );
  };

  const renderPanelBody = () => (
    <View className="min-h-0 flex-1 gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <AppIcon color={palette.primary} name="sparkles" size={18} />
            <Text className={typography.h3} style={{ color: palette.text }}>
              AI 助手
            </Text>
          </View>
          <Text className={`${typography.bodySmall} mt-1`} numberOfLines={2} style={{ color: palette.textSoft }}>
            当前语言：{currentLanguage || 'markdown'}，可做代码审查或按需求生成代码片段。
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Chip color={isBusy ? 'accent' : 'default'} size="sm" variant="soft">
            {isBusy ? '处理中' : '待命'}
          </Chip>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            关闭
          </Button>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Button
          className="flex-1"
          variant={activeTab === 'review' ? 'primary' : 'outline'}
          onPress={() => setActiveTab('review')}>
          代码审查
        </Button>
        <Button
          className="flex-1"
          variant={activeTab === 'generate' ? 'primary' : 'outline'}
          onPress={() => setActiveTab('generate')}>
          代码生成
        </Button>
      </View>

      {activeTab === 'review' ? (
        <View className="min-h-0 flex-1 gap-4">
          <GlassPanel className="px-4 py-4" variant="inset">
            <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
              审查重点 / 错误信息
            </Text>
            <TextArea
              className="mt-3"
              numberOfLines={4}
              placeholder="例如：这段代码运行时偶现空指针，请重点看并发安全和边界条件。"
              value={reviewFocus}
              onChangeText={value => {
                setReviewFocus(value);
                setReviewError(null);
              }}
            />
            <Button className="mt-4 self-start" isDisabled={reviewLoading} variant="primary" onPress={() => void handleReview()}>
              {reviewLoading ? (
                <>
                  <Spinner color="default" size="sm" />
                  <Button.Label>分析中...</Button.Label>
                </>
              ) : (
                '分析当前代码'
              )}
            </Button>
          </GlassPanel>

          <GlassPanel className="min-h-0 flex-1 px-4 py-4" variant="inset">
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}>
              {reviewError ? (
                <Text className={typography.bodySmall} style={{ color: palette.danger }}>{reviewError}</Text>
              ) : reviewResult ? (
                <View>
                  {renderResultMeta(reviewResult)}
                  <Markdown style={markdownStyle}>{reviewResult.content}</Markdown>
                </View>
              ) : (
                <Text className={typography.body} style={{ color: palette.textSoft }}>
                  点击“分析当前代码”后，AI 审查结果会显示在这里。
                </Text>
              )}
            </ScrollView>
          </GlassPanel>
        </View>
      ) : (
        <View className="min-h-0 flex-1 gap-4">
          <GlassPanel className="px-4 py-4" variant="inset">
            <Text className={`${typography.bodySmall} mb-3`} style={{ color: palette.textSoft }}>
              生成需求
            </Text>
            <TextArea
              numberOfLines={4}
              placeholder={`例如：生成一个 ${currentLanguage || 'TypeScript'} 版本的可撤销栈实现，并附带示例。`}
              value={generatePrompt}
              onChangeText={value => {
                setGeneratePrompt(value);
                setGenerateError(null);
              }}
            />
            <Button className="mt-4 self-start" isDisabled={generateLoading} variant="primary" onPress={() => void handleGenerate()}>
              {generateLoading ? (
                <>
                  <Spinner color="default" size="sm" />
                  <Button.Label>生成中...</Button.Label>
                </>
              ) : (
                '生成'
              )}
            </Button>
          </GlassPanel>

          <GlassPanel className="min-h-0 flex-1 px-4 py-4" variant="inset">
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}>
              {generateError ? (
                <Text className={typography.bodySmall} style={{ color: palette.danger }}>{generateError}</Text>
              ) : generatedResult ? (
                <View>
                  {renderResultMeta(generatedResult)}
                  <Markdown
                    style={{
                      ...markdownStyle,
                      body: {
                        ...markdownStyle.body,
                        fontSize,
                      },
                    }}>
                    {generatedResult.content}
                  </Markdown>
                </View>
              ) : (
                <Text className={typography.body} style={{ color: palette.textSoft }}>
                  输入 Prompt 后，生成结果会显示在这里。
                </Text>
              )}
            </ScrollView>
          </GlassPanel>

          <Button
            isDisabled={!generatedResult?.content.trim() || generateLoading}
            variant="outline"
            onPress={() => {
              if (generatedResult?.content.trim()) {
                onInsertGenerated(generatedResult.content);
              }
            }}>
            插入到编辑器
          </Button>
        </View>
      )}
    </View>
  );

  if (!isOpen) {
    return null;
  }

  if (inline) {
    return (
      <GlassPanel className="min-h-0 flex-1 px-5 py-5" variant="strong">
        {renderPanelBody()}
      </GlassPanel>
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
