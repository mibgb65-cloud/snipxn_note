import { Chip, Spinner } from 'heroui-native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Dialog } from 'heroui-native';

import { useAutoSave, useDeviceType } from '../../hooks';
import { translateLiteral, useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { useNoteStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import { AppIcon } from '../common/AppIcon';
import { GlassPanel, IconBadge } from '../common/AppChrome';

import { AiPanel } from './AiPanel';
import { CodeBlockRunner } from './CodeBlockRunner';
import { CodeEditor, type CodeEditorHandle } from './CodeEditor';
import type { RunnerStatus } from './CodeRunnerPanel';
import { NoteToolbar } from './NoteToolbar';

export interface NoteEditorPaneHandle {
  flushSave: () => Promise<void>;
  closeFloatingPanel: () => boolean;
}

export interface NoteEditorPaneProps {
  noteId: string | null;
  emptyMessage?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onEnterRunMode?: () => void;
  onExitRunMode?: () => void;
  preferCompactLayout?: boolean;
  surfaceMode?: 'panel' | 'plain';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return translateLiteral(error.message);
  }

  return fallback;
}

function toEditableTitle(title: string): string {
  return title === '无标题笔记' ? '' : title;
}

function toStoredTitle(title: string): string {
  const normalizedTitle = title.trim();
  return normalizedTitle.length > 0 ? normalizedTitle : '无标题笔记';
}

function normalizeLanguage(language: string): string {
  const normalizedLanguage = language.trim();
  return normalizedLanguage.length > 0 ? normalizedLanguage : 'markdown';
}

function toStoredLanguage(language: string): string | null {
  const normalizedLanguage = normalizeLanguage(language).toLowerCase();
  return normalizedLanguage === 'markdown' ? null : normalizedLanguage;
}

function formatEditorLanguageLabel(language: string): string {
  const normalizedLanguage = normalizeLanguage(language).toLowerCase();

  switch (normalizedLanguage) {
    case 'markdown':
      return 'MD';
    case 'plaintext':
      return 'TXT';
    case 'javascript':
      return 'JS';
    case 'typescript':
      return 'TS';
    case 'python':
      return 'PY';
    case 'kotlin':
      return 'KT';
    case 'cpp':
      return 'CPP';
    default:
      return normalizedLanguage.toUpperCase();
  }
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function getActivityHelperText(
  runnerStatus: RunnerStatus,
  aiBusy: boolean,
  saving: boolean,
  isPending: boolean,
  t: (text: string) => string,
): string {
  if (aiBusy) {
    return t('AI 正在处理中');
  }

  if (runnerStatus === 'running') {
    return t('代码正在沙盒中运行');
  }

  if (saving) {
    return t('保存中...');
  }

  if (isPending) {
    return t('自动保存将在 2 秒后触发');
  }

  return t('已同步到本地');
}

function mergeGeneratedContent(currentContent: string, generatedContent: string): string {
  const trimmedGenerated = generatedContent.trim();

  if (trimmedGenerated.length === 0) {
    return currentContent;
  }

  if (currentContent.trim().length === 0) {
    return trimmedGenerated;
  }

  return `${currentContent.replace(/\s+$/, '')}\n\n${trimmedGenerated}`;
}

export const NoteEditorPane = forwardRef<NoteEditorPaneHandle, NoteEditorPaneProps>(
  function NoteEditorPane(
    {
      noteId,
      emptyMessage = '选择一个笔记开始编辑。',
      isFullScreen = false,
      onToggleFullScreen,
      onEnterRunMode,
      onExitRunMode,
      preferCompactLayout = false,
      surfaceMode = 'panel',
    },
    ref,
  ) {
    const { palette, theme, typography, isTablet } = useAppTheme();
    const { t } = useI18n();
    const { height: windowHeight } = useWindowDimensions();
    const { showSidebar } = useDeviceType();
    const useSidePanelLayout = showSidebar && !preferCompactLayout;

    const { currentNote, saving, selectNote, updateNote } = useNoteStore(useShallow(state => ({
      currentNote: state.currentNote,
      saving: state.saving,
      selectNote: state.selectNote,
      updateNote: state.updateNote,
    })));

    const [titleInput, setTitleInput] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [languageInput, setLanguageInput] = useState('markdown');
    const [tagIdsInput, setTagIdsInput] = useState<string[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isRunnerOpen, setIsRunnerOpen] = useState(false);
    const [isBlockRunnerOpen, setIsBlockRunnerOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [isAiBusy, setIsAiBusy] = useState(false);
    const [isReadMode, setIsReadMode] = useState(false);
    const [runnerStatus, setRunnerStatus] = useState<RunnerStatus>('idle');

    const codeEditorRef = useRef<CodeEditorHandle>(null);

    const titleRef = useRef('');
    const contentRef = useRef('');
    const languageRef = useRef('markdown');
    const tagIdsRef = useRef<string[]>([]);
    const savePromiseRef = useRef<Promise<void> | null>(null);
    const persistedRef = useRef<{
      title: string;
      content: string;
      primaryLanguage: string | null;
      tagIds: string[];
    }>({
      title: '无标题笔记',
      content: '',
      primaryLanguage: null,
      tagIds: [],
    });

    const note = noteId && currentNote?.id === noteId ? currentNote : null;
    const readOnly = note?.status === 'LOCKED' || note?.isDeleted === true;
    const editorMinHeight = isTablet
      ? Math.max(380, Math.floor(windowHeight * 0.48))
      : Math.max(260, Math.floor(windowHeight * 0.36));

    useEffect(() => {
      if (!noteId) {
        setLoadError(null);
        return;
      }

      if (currentNote?.id === noteId) {
        setLoadError(null);
        return;
      }

      let isCancelled = false;

      void (async () => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 300;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          if (isCancelled) return;

          try {
            await selectNote(noteId);

            if (!isCancelled) {
              setLoadError(null);
            }
            return;
          } catch (error) {
            const message = getErrorMessage(error, '');
            const isNotFound = message.toLowerCase().includes('not found');

            if (isNotFound && attempt < MAX_RETRIES - 1) {
              await new Promise<void>(resolve => setTimeout(resolve, RETRY_DELAY));
              continue;
            }

            if (!isCancelled) {
              setLoadError(getErrorMessage(error, t('加载笔记失败，请稍后重试。')));
            }
            return;
          }
        }
      })();

      return () => {
        isCancelled = true;
      };
    }, [currentNote?.id, noteId, selectNote, t]);

    useEffect(() => {
      if (!note) {
        return;
      }

      const editableTitle = toEditableTitle(note.title);
      const normalizedLanguage = note.primaryLanguage ?? 'markdown';

      setTitleInput(editableTitle);
      setEditorContent(note.content);
      setLanguageInput(normalizedLanguage);
      setTagIdsInput(note.tagIds);
      setSaveError(null);
      setIsRunnerOpen(false);
      setIsBlockRunnerOpen(false);
      setIsAiOpen(false);
      setIsAiBusy(false);
      setIsReadMode(false);
      setRunnerStatus('idle');

      titleRef.current = editableTitle;
      contentRef.current = note.content;
      languageRef.current = normalizedLanguage;
      tagIdsRef.current = note.tagIds;
      persistedRef.current = {
        title: note.title,
        content: note.content,
        primaryLanguage: note.primaryLanguage,
        tagIds: note.tagIds,
      };
    }, [note]);

    const persistNote = useCallback(async () => {
      if (!note) {
        return;
      }

      if (savePromiseRef.current) {
        await savePromiseRef.current;
        return;
      }

      const saveTask = (async () => {
        const nextTitle = toStoredTitle(titleRef.current);
        const nextContent = contentRef.current;
        const nextPrimaryLanguage = toStoredLanguage(languageRef.current);
        const nextTagIds = [...tagIdsRef.current];
        const nextPayload: {
          title?: string;
          content?: string;
          primaryLanguage?: string | null;
          tagIds?: string[];
        } = {};

        if (nextTitle !== persistedRef.current.title) {
          nextPayload.title = nextTitle;
        }

        if (nextContent !== persistedRef.current.content) {
          nextPayload.content = nextContent;
        }

        if (nextPrimaryLanguage !== persistedRef.current.primaryLanguage) {
          nextPayload.primaryLanguage = nextPrimaryLanguage;
        }

        if (!areStringArraysEqual(nextTagIds, persistedRef.current.tagIds)) {
          nextPayload.tagIds = nextTagIds;
        }

        if (Object.keys(nextPayload).length === 0) {
          return;
        }

        try {
          await updateNote(note.id, nextPayload);
          persistedRef.current = {
            title: nextTitle,
            content: nextContent,
            primaryLanguage: nextPrimaryLanguage,
            tagIds: nextTagIds,
          };
          setSaveError(null);
        } catch (error) {
          setSaveError(getErrorMessage(error, t('自动保存失败，请稍后重试。')));
          throw error;
        }
      })();

      savePromiseRef.current = saveTask;

      try {
        await saveTask;
      } finally {
        if (savePromiseRef.current === saveTask) {
          savePromiseRef.current = null;
        }
      }
    }, [note, t, updateNote]);

    const { trigger, flush, isPending } = useAutoSave(async () => {
      await persistNote();
    }, 2000);

    const requestSave = useCallback(async () => {
      if (isPending) {
        await flush();
        return;
      }

      await persistNote();
    }, [flush, isPending, persistNote]);

    const handleRunnerOpenChange = (open: boolean) => {
      setIsBlockRunnerOpen(open);
      setIsRunnerOpen(false);

      if (open) {
        setIsAiOpen(false);
      }

      if (useSidePanelLayout) {
        if (open) {
          onEnterRunMode?.();
        } else {
          onExitRunMode?.();
        }
      }
    };

    const handleAiOpenChange = (open: boolean) => {
      setIsAiOpen(open);

      if (useSidePanelLayout) {
        // Tablet: side panel + run mode (same pattern as code runner)
        if (open) {
          setIsRunnerOpen(false);
          setIsBlockRunnerOpen(false);
          onEnterRunMode?.();
        } else {
          onExitRunMode?.();
        }
      } else {
        // Mobile: dialog mode
        if (open) {
          setIsRunnerOpen(false);
        }
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        flushSave: async () => {
          await requestSave();
        },
        closeFloatingPanel: () => {
          if (isAiOpen) {
            setIsAiOpen(false);
            if (useSidePanelLayout) {
              onExitRunMode?.();
            }
            return true;
          }

          if (isBlockRunnerOpen) {
            setIsBlockRunnerOpen(false);
            if (useSidePanelLayout) {
              onExitRunMode?.();
            }
            return true;
          }

          if (isRunnerOpen) {
            setIsRunnerOpen(false);
            return true;
          }

          return false;
        },
      }),
      [isAiOpen, isBlockRunnerOpen, isRunnerOpen, onExitRunMode, requestSave, useSidePanelLayout],
    );

    useEffect(() => {
      return () => {
        void requestSave();
      };
    }, [isPending, note?.id, requestSave]);

    const handleContentChange = (content: string) => {
      setEditorContent(content);
      contentRef.current = content;
      setSaveError(null);

      if (!readOnly) {
        trigger();
      }
    };

    const handleTitleChange = (nextTitle: string) => {
      setTitleInput(nextTitle);
      titleRef.current = nextTitle;
      setSaveError(null);

      if (!readOnly) {
        trigger();
      }
    };

    const handleLanguageChange = (nextLanguage: string) => {
      const normalizedLanguage = normalizeLanguage(nextLanguage);

      setLanguageInput(normalizedLanguage);
      languageRef.current = normalizedLanguage;
      setSaveError(null);

      if (!readOnly) {
        trigger();
      }
    };

    const handleTagIdsChange = (nextTagIds: string[]) => {
      setTagIdsInput(nextTagIds);
      tagIdsRef.current = nextTagIds;
      setSaveError(null);

      if (!readOnly) {
        trigger();
      }
    };

    const handleInsertGeneratedContent = (generatedContent: string) => {
      const mergedContent = mergeGeneratedContent(contentRef.current, generatedContent);

      if (mergedContent === contentRef.current) {
        return;
      }

      setEditorContent(mergedContent);
      contentRef.current = mergedContent;
      setSaveError(null);

      if (!readOnly) {
        trigger();
      }
    };

    if (!noteId) {
      return (
        <GlassPanel
          className="flex-1 items-center justify-center px-8 py-10"
          highlight={palette.primary}
          variant="strong">
          <IconBadge icon="notes" iconSize={28} size={64} />
          <Text className={`${typography.h3} text-center`} style={{ color: palette.textMuted }}>
            {emptyMessage}
          </Text>
        </GlassPanel>
      );
    }

    if (loadError && !note) {
      return (
        <GlassPanel
          className="flex-1 items-center justify-center gap-3 px-8 py-10"
          highlight={palette.danger}
          variant="strong">
          <AppIcon color={palette.danger} name="alert-circle" size={26} />
          <Text className={`${typography.h3} text-center`} style={{ color: palette.text }}>
            {t('无法打开笔记')}
          </Text>
          <Text className={`${typography.body} text-center`} style={{ color: palette.danger }}>
            {loadError}
          </Text>
        </GlassPanel>
      );
    }

    if (!note) {
      return (
        <GlassPanel className="flex-1 items-center justify-center gap-3 px-8 py-10" variant="strong">
          <Spinner color={theme === 'dark' ? 'default' : palette.accent} size="lg" />
          <Text className={typography.body} style={{ color: palette.textSoft }}>
            {t('正在加载笔记内容...')}
          </Text>
        </GlassPanel>
      );
    }

    const editorPaneContent = (
      <>
        <NoteToolbar
          content={editorContent}
          isAiBusy={isAiBusy}
          isAiOpen={isAiOpen}
          isFullScreen={isFullScreen}
          isReadMode={isReadMode}
          isRunnerOpen={isRunnerOpen || isBlockRunnerOpen}
          isRunningCode={runnerStatus === 'running'}
          language={languageInput}
          note={note}
          onLanguageChange={handleLanguageChange}
          onRequestSave={requestSave}
          onTagIdsChange={handleTagIdsChange}
          onTitleChange={handleTitleChange}
          onToggleAi={() => handleAiOpenChange(!isAiOpen)}
          onToggleFullScreen={onToggleFullScreen}
          onToggleReadMode={() => setIsReadMode(prev => !prev)}
          onToggleRunner={() => handleRunnerOpenChange(!(isRunnerOpen || isBlockRunnerOpen))}
          preferCompactLayout={preferCompactLayout}
          readOnly={readOnly}
          tagIds={tagIdsInput}
          title={titleInput}
        />

        <View
          className="mb-2 rounded-[8px] px-2.5 py-2"
          style={{ backgroundColor: palette.panelInset }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center gap-1.5 pr-1">
              <Chip color="accent" size="sm" variant="soft">
                {formatEditorLanguageLabel(languageInput)}
              </Chip>
              {note.isStarred ? (
                <Chip color="warning" size="sm" variant="soft">
                  {t('已收藏')}
                </Chip>
              ) : null}
              {readOnly ? (
                <Chip color="default" size="sm" variant="soft">
                  {t('只读')}
                </Chip>
              ) : null}
              {isAiBusy ? (
                <Chip color="accent" size="sm" variant="soft">
                  {t('AI 处理中')}
                </Chip>
              ) : null}
              {runnerStatus !== 'idle' ? (
                <Chip
                  color={
                    runnerStatus === 'success'
                      ? 'success'
                      : runnerStatus === 'running'
                        ? 'accent'
                        : runnerStatus === 'timeout'
                          ? 'warning'
                          : 'danger'
                  }
                  size="sm"
                  variant="soft">
                  {runnerStatus === 'running'
                    ? t('运行中')
                    : runnerStatus === 'success'
                      ? t('运行成功')
                      : runnerStatus === 'timeout'
                        ? t('运行超时')
                        : t('运行失败')}
                </Chip>
              ) : null}
              <View className="flex-row items-center gap-1.5">
                <AppIcon color={palette.textSoft} name="refresh" size={13} />
                <Text className={typography.caption} style={{ color: palette.textSoft }}>
                  {getActivityHelperText(runnerStatus, isAiBusy, saving, isPending, t)}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {saveError ? (
          <View
            className="mb-2 flex-row items-center gap-2 rounded-2xl px-3 py-2"
            style={{ backgroundColor: withAlpha(palette.danger, 0.12) }}>
            <AppIcon color={palette.danger} name="alert-circle" size={16} />
            <Text className={typography.bodySmall} style={{ color: palette.danger }}>
              {saveError}
            </Text>
          </View>
        ) : null}

        {(isBlockRunnerOpen || (isAiOpen && useSidePanelLayout)) ? (
          <View className="flex-1 min-h-0 flex-row" style={{ minHeight: editorMinHeight }}>
            <View style={{ flex: 3, minWidth: 200 }}>
              <CodeEditor
                ref={codeEditorRef}
                content={editorContent}
                language={languageInput}
                onContentChange={handleContentChange}
                readOnly={readOnly || isReadMode}
              />
            </View>
            <View style={{ flex: 2, maxWidth: 420, minWidth: 260 }}>
              {isBlockRunnerOpen ? (
                <CodeBlockRunner
                  content={editorContent}
                  documentLanguage={languageInput}
                  onClose={() => handleRunnerOpenChange(false)}
                  onScrollToLine={(line) => codeEditorRef.current?.scrollToLine(line)}
                  onStatusChange={setRunnerStatus}
                />
              ) : (
                <AiPanel
                  inline
                  currentContent={editorContent}
                  currentLanguage={languageInput}
                  isOpen
                  onBusyChange={setIsAiBusy}
                  onInsertGenerated={handleInsertGeneratedContent}
                  onOpenChange={handleAiOpenChange}
                />
              )}
            </View>
          </View>
        ) : (
          <View className="flex-1 min-h-0" style={{ minHeight: editorMinHeight }}>
            <CodeEditor
              ref={codeEditorRef}
              content={editorContent}
              language={languageInput}
              onContentChange={handleContentChange}
              readOnly={readOnly || isReadMode}
            />
          </View>
        )}

        {!useSidePanelLayout && (
          <AiPanel
            currentContent={editorContent}
            currentLanguage={languageInput}
            isOpen={isAiOpen}
            onBusyChange={setIsAiBusy}
            onInsertGenerated={handleInsertGeneratedContent}
            onOpenChange={handleAiOpenChange}
          />
        )}

        {!useSidePanelLayout ? (
          <Dialog isOpen={isBlockRunnerOpen} onOpenChange={handleRunnerOpenChange}>
            <Dialog.Portal>
              <Dialog.Overlay />
              <Dialog.Content
                className="mt-auto rounded-b-none rounded-t-3xl p-0"
                style={{
                  backgroundColor: 'transparent',
                  height: Math.max(520, Math.floor(windowHeight * 0.8)),
                }}>
                <CodeBlockRunner
                  content={editorContent}
                  documentLanguage={languageInput}
                  onClose={() => handleRunnerOpenChange(false)}
                  onScrollToLine={(line) => codeEditorRef.current?.scrollToLine(line)}
                  onStatusChange={setRunnerStatus}
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        ) : null}
      </>
    );

    if (surfaceMode === 'plain') {
      return (
        <View className="relative flex-1 px-1 py-1">
          {editorPaneContent}
        </View>
      );
    }

    return (
      <GlassPanel className="relative flex-1 px-4 py-3" variant="strong">
        {editorPaneContent}
      </GlassPanel>
    );
  },
);

NoteEditorPane.displayName = 'NoteEditorPane';
