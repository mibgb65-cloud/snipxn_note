import { useNavigation } from '@react-navigation/native';
import { Button, Dialog, FieldError, Input, Label, Spinner, TextField } from 'heroui-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useShallow } from 'zustand/react/shallow';

import { useNoteStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import type { Tag } from '../../types';
import { GlassPanel } from '../common/AppChrome';
import { AppIcon } from '../common/AppIcon';

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const FALLBACK_TAG_COLOR = '#94A3B8';
const SIDEBAR_LIST_ICON_SIZE = 17;
const TAG_COLOR_OPTIONS = [
  { label: '青绿', value: '#14B8A6' },
  { label: '天空蓝', value: '#0EA5E9' },
  { label: '橙色', value: '#F97316' },
  { label: '琥珀', value: '#F59E0B' },
  { label: '绿色', value: '#22C55E' },
  { label: '玫红', value: '#F43F5E' },
  { label: '石板灰', value: '#64748B' },
  { label: '靛蓝', value: '#6366F1' },
] as const;

type TagDialogMode = 'create' | 'edit' | null;

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

function resolveTagColor(color: string | null): string {
  if (color && HEX_COLOR_PATTERN.test(color)) {
    return color;
  }

  return FALLBACK_TAG_COLOR;
}

function buildTagColorOptions(selectedColor: string) {
  const resolvedColor = resolveTagColor(selectedColor || null);

  if (TAG_COLOR_OPTIONS.some(option => option.value === resolvedColor)) {
    return TAG_COLOR_OPTIONS;
  }

  return [{ label: '当前', value: resolvedColor }, ...TAG_COLOR_OPTIONS];
}

export function TagList() {
  const navigation = useNavigation<any>();
  const { palette, typography } = useAppTheme();

  const { tags, activeTagId, createTag, updateTag, deleteTag, fetchNotes, setActiveTagId, setActiveView } = useNoteStore(useShallow(state => ({
    tags: state.tags,
    activeTagId: state.activeTagId,
    createTag: state.createTag,
    updateTag: state.updateTag,
    deleteTag: state.deleteTag,
    fetchNotes: state.fetchNotes,
    setActiveTagId: state.setActiveTagId,
    setActiveView: state.setActiveView,
  })));

  const [dialogMode, setDialogMode] = useState<TagDialogMode>(null);
  const [menuTag, setMenuTag] = useState<Tag | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [colorInput, setColorInput] = useState<string>(TAG_COLOR_OPTIONS[0].value);
  const [nameTouched, setNameTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nameError = useMemo(() => {
    if (dialogMode && nameInput.trim().length === 0) {
      return '请输入标签名称';
    }

    return null;
  }, [dialogMode, nameInput]);

  const selectedTagColor = resolveTagColor(colorInput || null);
  const tagColorOptions = useMemo(() => buildTagColorOptions(colorInput), [colorInput]);
  const tagPreviewName = nameInput.trim() || '标签名称';

  const closeDialogs = () => {
    setDialogMode(null);
    setMenuTag(null);
    setEditingTag(null);
    setNameTouched(false);
    setSubmitting(false);
    setErrorMessage(null);
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setMenuTag(null);
    setEditingTag(null);
    setNameInput('');
    setColorInput(TAG_COLOR_OPTIONS[0].value);
    setNameTouched(false);
    setErrorMessage(null);
  };

  const openEditDialog = (tag: Tag) => {
    setMenuTag(null);
    setEditingTag(tag);
    setDialogMode('edit');
    setNameInput(tag.name);
    setColorInput(tag.color ? resolveTagColor(tag.color) : TAG_COLOR_OPTIONS[0].value);
    setNameTouched(false);
    setErrorMessage(null);
  };

  const handleSelectTag = async (tagId: string) => {
    setActiveView('all');
    setActiveTagId(tagId);
    await fetchNotes();
    navigation.navigate('Workspace');
  };

  const handleDeleteTag = async (tag: Tag) => {
    setSubmitting(true);

    try {
      await deleteTag(tag.id);
      closeDialogs();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, '删除标签失败，请稍后重试。'));
    }
  };

  const handleSubmit = async () => {
    setNameTouched(true);
    setErrorMessage(null);

    if (nameError) {
      return;
    }

    setSubmitting(true);

    try {
      const nextColor = selectedTagColor;

      if (dialogMode === 'create') {
        await createTag(nameInput.trim(), nextColor);
      } else if (dialogMode === 'edit' && editingTag) {
        await updateTag(editingTag.id, {
          name: nameInput.trim(),
          color: nextColor ?? null,
        });
      }

      closeDialogs();
    } catch (error) {
      setSubmitting(false);
      setErrorMessage(getErrorMessage(error, '保存标签失败，请稍后重试。'));
    }
  };

  return (
    <View className="gap-0">
      <View className="gap-0">
        {tags.map(tag => {
          const isActive = activeTagId === tag.id;

          return (
            <Pressable
              key={tag.id}
              className="border-b px-0 py-0"
              onLongPress={() => {
                setMenuTag(tag);
                setErrorMessage(null);
              }}
              onPress={() => {
                void handleSelectTag(tag.id);
              }}
              style={{
                borderBottomColor: withAlpha(palette.border, 0.72),
                borderBottomWidth: 1,
                backgroundColor: isActive ? withAlpha(palette.primary, 0.08) : 'transparent',
              }}>
              <View className="flex-row items-center gap-3 px-1 py-2">
                <View
                  className="h-6 w-1"
                  style={{ backgroundColor: isActive ? palette.primary : 'transparent' }}
                />
                <View
                  className="h-8 w-8 items-center justify-center">
                  <AppIcon
                    color={resolveTagColor(tag.color)}
                    name="tag"
                    size={SIDEBAR_LIST_ICON_SIZE}
                    strokeWidth={2}
                  />
                </View>
                <Text
                  className={`${typography.body} flex-1`}
                  numberOfLines={1}
                  style={{ color: palette.text }}>
                  {tag.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        className="border-b px-0 py-0"
        onPress={openCreateDialog}
        style={{
          borderBottomColor: withAlpha(palette.border, 0.72),
          borderBottomWidth: 1,
        }}>
        <View className="flex-row items-center gap-3 px-1 py-2">
          <View className="h-8 w-8 items-center justify-center">
            <AppIcon color={palette.primary} name="plus" size={SIDEBAR_LIST_ICON_SIZE} />
          </View>
          <Text className={typography.body} style={{ color: palette.primary }}>
            新建标签
          </Text>
        </View>
      </Pressable>

      <Dialog isOpen={menuTag !== null} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-6 rounded-[10px] p-0" style={{ backgroundColor: 'transparent' }}>
            <GlassPanel className="px-6 py-6" highlight={palette.primary}>
              <View className="gap-5">
                <View
                  className="rounded-[10px] border px-4 py-4"
                  style={{ borderColor: palette.border, backgroundColor: palette.panelInset }}>
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-12 w-12 items-center justify-center rounded-[10px] border"
                      style={{
                        borderColor: withAlpha(resolveTagColor(menuTag?.color ?? null), 0.24),
                        backgroundColor: withAlpha(resolveTagColor(menuTag?.color ?? null), 0.12),
                      }}>
                      <AppIcon color={resolveTagColor(menuTag?.color ?? null)} name="tag" size={20} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className={typography.caption} style={{ color: palette.primary }}>
                        Tag Actions
                      </Text>
                      <Dialog.Title>{menuTag?.name ?? '标签操作'}</Dialog.Title>
                      <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                        调整标签名称或移除当前标签。
                      </Text>
                    </View>
                  </View>
                </View>

                {errorMessage ? (
                  <Text className={typography.bodySmall} style={{ color: palette.danger }}>
                    {errorMessage}
                  </Text>
                ) : null}

                <View className="gap-2.5">
                  <Button
                    isDisabled={submitting}
                    variant="outline"
                    onPress={() => menuTag && openEditDialog(menuTag)}>
                    编辑标签
                  </Button>
                  <Button
                    isDisabled={submitting || !menuTag}
                    variant="danger"
                    onPress={() => menuTag && void handleDeleteTag(menuTag)}>
                    删除
                  </Button>
                </View>

                <Button isDisabled={submitting} variant="ghost" onPress={closeDialogs}>
                  取消
                </Button>
              </View>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={dialogMode !== null} onOpenChange={open => !open && closeDialogs()}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-6 rounded-[10px] p-0" style={{ backgroundColor: 'transparent' }}>
            <GlassPanel className="px-6 py-6" highlight={palette.primary}>
              <View className="gap-5">
                <View className="gap-1">
                  <Text className={typography.caption} style={{ color: palette.primary }}>
                    Tag Setup
                  </Text>
                  <Dialog.Title>{dialogMode === 'create' ? '新建标签' : '编辑标签'}</Dialog.Title>
                  <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                    选择预设颜色，让标签在笔记列表里更容易被识别。
                  </Text>
                </View>

                <View
                  className="rounded-[10px] border px-4 py-4"
                  style={{ borderColor: palette.border, backgroundColor: palette.panelInset }}>
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-12 w-12 items-center justify-center rounded-[10px] border"
                      style={{
                        borderColor: withAlpha(selectedTagColor, 0.24),
                        backgroundColor: withAlpha(selectedTagColor, 0.12),
                      }}>
                      <AppIcon color={selectedTagColor} name="tag" size={20} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <View
                        className="self-start rounded-full px-3 py-1"
                        style={{ backgroundColor: withAlpha(selectedTagColor, 0.14) }}>
                        <Text className={typography.caption} style={{ color: selectedTagColor }}>
                          {tagPreviewName}
                        </Text>
                      </View>
                      <Text className={`${typography.bodySmall} mt-2`} style={{ color: palette.textSoft }}>
                        预览当前标签的视觉效果
                      </Text>
                    </View>
                  </View>
                </View>

                {errorMessage ? (
                  <Text className={typography.bodySmall} style={{ color: palette.danger }}>
                    {errorMessage}
                  </Text>
                ) : null}

                <TextField isRequired isInvalid={nameTouched && nameError !== null}>
                  <Label>名称</Label>
                  <Input
                    placeholder="请输入标签名称"
                    value={nameInput}
                    onBlur={() => setNameTouched(true)}
                    onChangeText={value => {
                      setNameInput(value);
                      setErrorMessage(null);
                    }}
                  />
                  <FieldError>{nameError ?? ''}</FieldError>
                </TextField>

                <View className="gap-3">
                  <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                    选择颜色
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    {tagColorOptions.map(option => {
                      const isSelected = selectedTagColor === option.value;

                      return (
                        <Pressable
                          key={`${option.label}-${option.value}`}
                          className="h-12 w-12 items-center justify-center rounded-[10px] border"
                          onPress={() => {
                            setColorInput(option.value);
                            setErrorMessage(null);
                          }}
                          style={{
                            borderColor: isSelected ? withAlpha(option.value, 0.52) : palette.border,
                            backgroundColor: isSelected ? withAlpha(option.value, 0.12) : palette.surfaceAlt,
                          }}>
                          <View className="h-5 w-5 rounded-full" style={{ backgroundColor: option.value }} />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <Button className="flex-1" isDisabled={submitting} variant="ghost" onPress={closeDialogs}>
                    取消
                  </Button>
                  <Button className="flex-1" isDisabled={submitting} variant="primary" onPress={() => void handleSubmit()}>
                    {submitting ? (
                      <>
                        <Spinner color="default" size="sm" />
                        <Button.Label>保存中...</Button.Label>
                      </>
                    ) : dialogMode === 'create' ? (
                      '创建标签'
                    ) : (
                      '保存'
                    )}
                  </Button>
                </View>
              </View>
            </GlassPanel>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}
