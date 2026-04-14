import { Button, Dialog, Spinner } from 'heroui-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { translateLiteral, useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { useFolderStore, useNoteStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import type { Note } from '../../types';
import type { AppLanguage } from '../../utils/preferences';
import { formatRelativeTime } from '../../utils/time';
import {
  MotionPressable,
} from '../common/AppMotion';
import { GlassPanel, IconBadge } from '../common/AppChrome';
import { AppIcon } from '../common/AppIcon';

export interface NoteListItemProps {
  note: Note;
  isSelected: boolean;
  onPress: () => void;
  compactLayout?: boolean;
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

function formatLanguage(language: string | null): string | null {
  if (!language) {
    return null;
  }

  return language.trim().toUpperCase();
}

function formatNoteType(language: string | null): string {
  const normalizedLanguage = (language ?? 'markdown').trim().toLowerCase();

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
      return formatLanguage(normalizedLanguage) ?? 'NOTE';
  }
}

function getUtf8ByteLength(value: string): number {
  let byteLength = 0;

  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);

    if (codePoint <= 0x7f) {
      byteLength += 1;
      continue;
    }

    if (codePoint <= 0x7ff) {
      byteLength += 2;
      continue;
    }

    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      byteLength += 4;
      index += 1;
      continue;
    }

    byteLength += 3;
  }

  return byteLength;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(bytes >= 10 * 1024 ? 0 : 1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSyncMeta(
  updatedAt: string,
  syncStatus: Note['syncStatus'],
  language: AppLanguage,
  t: (text: string) => string,
): string {
  if (syncStatus === 'created') {
    return t('待首次同步');
  }

  if (syncStatus === 'updated') {
    return t('待同步');
  }

  if (syncStatus === 'deleted') {
    return t('已删除');
  }

  return formatRelativeTime(updatedAt, language);
}

export function NoteListItem({
  note,
  isSelected,
  onPress,
  compactLayout = false,
}: NoteListItemProps) {
  const { palette, typography } = useAppTheme();
  const { language, t } = useI18n();

  const { activeView, toggleStar, updateNote, deleteNote, restoreNote, permanentDeleteNote } = useNoteStore(useShallow(state => ({
    activeView: state.activeView,
    toggleStar: state.toggleStar,
    updateNote: state.updateNote,
    deleteNote: state.deleteNote,
    restoreNote: state.restoreNote,
    permanentDeleteNote: state.permanentDeleteNote,
  })));

  const folders = useFolderStore(state => state.folders);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const noteTypeLabel = useMemo(() => formatNoteType(note.primaryLanguage), [note.primaryLanguage]);
  const fileSizeLabel = useMemo(() => formatFileSize(getUtf8ByteLength(note.content)), [note.content]);
  const syncMetaLabel = useMemo(
    () => formatSyncMeta(note.updatedAt, note.syncStatus, language, t),
    [language, note.syncStatus, note.updatedAt, t],
  );
  const moveTargets = useMemo(
    () => folders.filter(folder => folder.id !== note.folderId),
    [folders, note.folderId],
  );

  const closeDialogs = () => {
    setIsMenuOpen(false);
    setIsMoveDialogOpen(false);
    setSubmitting(false);
    setErrorMessage(null);
  };

  const handleToggleStar = async () => {
    setSubmitting(true);

    try {
      await toggleStar(note.id);
      closeDialogs();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, t('更新收藏状态失败，请稍后重试。')));
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);

    try {
      await deleteNote(note.id);
      closeDialogs();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, t('删除笔记失败，请稍后重试。')));
    }
  };

  const handleRestore = async () => {
    setSubmitting(true);

    try {
      await restoreNote(note.id);
      closeDialogs();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, t('恢复笔记失败，请稍后重试。')));
    }
  };

  const handlePermanentDelete = async () => {
    setSubmitting(true);

    try {
      await permanentDeleteNote(note.id);
      closeDialogs();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, t('彻底删除失败，请稍后重试。')));
    }
  };

  const handleMoveToFolder = async (folderId: string) => {
    setSubmitting(true);

    try {
      await updateNote(note.id, { folderId });
      closeDialogs();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, t('移动笔记失败，请稍后重试。')));
    }
  };

  const isTrashView = activeView === 'trash';

  return (
    <>
      <View className={compactLayout ? 'flex-1' : ''}>
          <MotionPressable
            accessibilityRole="button"
            className={`${compactLayout ? 'mb-4 flex-1 rounded-[14px]' : 'mb-3 rounded-[10px]'} border px-4 py-4`}
            onLongPress={() => {
              setErrorMessage(null);
              setIsMenuOpen(true);
            }}
            onPress={onPress}
            style={{
              minHeight: compactLayout ? 176 : undefined,
              borderColor: isSelected ? withAlpha(palette.primary, 0.42) : palette.border,
              backgroundColor: isSelected ? withAlpha(palette.primary, 0.1) : palette.panelRaised,
              shadowColor: palette.shadow,
              shadowOpacity: isSelected ? 0.18 : 0.1,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 10 },
              elevation: isSelected ? 10 : 5,
            }}>
            <View className="gap-3">
            <View className="flex-row items-start gap-3">
              <IconBadge
                backgroundColor={isSelected ? withAlpha(palette.primary, 0.18) : palette.panelInset}
                color={isSelected ? palette.primary : palette.textMuted}
                icon="notes"
                iconSize={19}
                size={44}
              />
              <View className="min-w-0 flex-1 gap-2">
                <View className="flex-row items-start gap-3">
                  <Text
                    className={`${typography.h3} min-w-0 flex-1`}
                    numberOfLines={compactLayout ? 2 : 1}
                    style={{ color: palette.text }}>
                    {note.title}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {note.isStarred ? <AppIcon color="#F59E0B" name="star-filled" size={16} /> : null}
                    <View
                      className="shrink-0 rounded-[8px] border px-2.5 py-1"
                      style={{
                        borderColor: withAlpha(palette.primary, 0.18),
                        backgroundColor: isSelected ? withAlpha(palette.primary, 0.14) : palette.panelInset,
                      }}>
                      <Text className={typography.caption} style={{ color: palette.primary }}>
                        {noteTypeLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text
                  className={typography.bodySmall}
                  numberOfLines={compactLayout ? 3 : 2}
                  style={{ color: palette.textSoft }}>
                  {note.summary?.trim() || t('暂无摘要')}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between gap-3">
              <Text className={typography.caption} style={{ color: palette.textSoft }}>
                {fileSizeLabel}
              </Text>
              <Text
                className={typography.caption}
                style={{ color: note.syncStatus === 'synced' ? palette.textSoft : palette.primary }}>
                {syncMetaLabel}
              </Text>
            </View>
            </View>
          </MotionPressable>
      </View>

      <Dialog
        isOpen={isMenuOpen}
        onOpenChange={open => {
          if (!open) {
            closeDialogs();
          }
        }}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-6 rounded-[10px] p-0" style={{ backgroundColor: 'transparent' }}>
            <GlassPanel className="px-6 py-6" highlight={palette.primary}>
              <View className="gap-4">
                <Dialog.Title>{note.title}</Dialog.Title>
                {errorMessage ? (
                  <Text className={typography.bodySmall} style={{ color: palette.danger }}>
                    {errorMessage}
                  </Text>
                ) : null}

                {isTrashView ? (
                  <>
                    <Button isDisabled={submitting} variant="outline" onPress={() => void handleRestore()}>
                      {t('恢复笔记')}
                    </Button>
                    <Button
                      isDisabled={submitting}
                      variant="danger"
                      onPress={() => void handlePermanentDelete()}>
                      {t('彻底删除')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button isDisabled={submitting} variant="outline" onPress={() => void handleToggleStar()}>
                      {note.isStarred ? t('取消收藏') : t('收藏笔记')}
                    </Button>
                    <Button
                      isDisabled={submitting || moveTargets.length === 0}
                      variant="outline"
                      onPress={() => {
                        setIsMenuOpen(false);
                        setIsMoveDialogOpen(true);
                      }}>
                      {t('移动到文件夹')}
                    </Button>
                    <Button isDisabled={submitting} variant="danger" onPress={() => void handleDelete()}>
                      {t('删除')}
                    </Button>
                  </>
                )}

                <Button isDisabled={submitting} variant="ghost" onPress={closeDialogs}>
                  {t('取消')}
                </Button>
              </View>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog
        isOpen={isMoveDialogOpen}
        onOpenChange={open => {
          if (!open) {
            closeDialogs();
          }
        }}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-6 rounded-[10px] p-0" style={{ backgroundColor: 'transparent' }}>
            <GlassPanel className="px-6 py-6" highlight={palette.primary}>
              <View className="gap-4">
                <Dialog.Title>{t('移动到文件夹')}</Dialog.Title>
                {errorMessage ? (
                  <Text className={typography.bodySmall} style={{ color: palette.danger }}>
                    {errorMessage}
                  </Text>
                ) : null}
                {moveTargets.length > 0 ? (
                  moveTargets.map(folder => (
                    <Button
                      key={folder.id}
                      isDisabled={submitting}
                      variant="outline"
                      onPress={() => void handleMoveToFolder(folder.id)}>
                      {folder.icon} {folder.name}
                    </Button>
                  ))
                ) : (
                  <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                    {t('暂无可移动的目标文件夹。')}
                  </Text>
                )}
                <Button isDisabled={submitting} variant="ghost" onPress={closeDialogs}>
                  {submitting ? (
                    <>
                      <Spinner color="default" size="sm" />
                      <Button.Label>{t('处理中...')}</Button.Label>
                    </>
                  ) : (
                    t('关闭')
                  )}
                </Button>
              </View>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
