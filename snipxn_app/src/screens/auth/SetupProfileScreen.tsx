import {
  Alert,
  Avatar,
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  TextArea,
  TextField,
} from 'heroui-native';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '../../api/axios';
import * as fileApi from '../../api/file';
import { AppIcon } from '../../components/common/AppIcon';
import { translateLiteral, useI18n } from '../../i18n';
import { useDeviceType } from '../../hooks';
import { useAuthStore, useUserStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';

type FeedbackState = {
  status: 'success' | 'warning' | 'danger';
  title: string;
  description: string;
} | null;

const DEFAULT_BIO_PLACEHOLDER = '一句话介绍自己';
const BIRTHDAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_BIRTHDAY_YEAR = 2000;
const MIN_BIRTHDAY_YEAR = 1900;
const NICKNAME_MAX_LENGTH = 50;
const BIO_MAX_LENGTH = 200;

interface DateParts {
  year: number;
  month: number;
  day: number;
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

function getAvatarFallback(userEmail: string | undefined, nickname: string): string {
  const source = nickname.trim() || userEmail?.trim() || 'S';

  return source.slice(0, 1).toUpperCase();
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateParts(parts: DateParts): string {
  return [
    String(parts.year).padStart(4, '0'),
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
  ].join('-');
}

function parseDateInput(value: string): DateParts | null {
  const match = BIRTHDAY_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[0].slice(0, 4));
  const month = Number(match[0].slice(5, 7));
  const day = Number(match[0].slice(8, 10));
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  ) {
    return { year, month, day };
  }

  return null;
}

function isValidDateInput(value: string): boolean {
  return parseDateInput(value) !== null;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function buildNumberRange(start: number, end: number): number[] {
  const length = Math.max(0, end - start + 1);
  return Array.from({ length }, (_, index) => start + index);
}

function getInitialBirthdayParts(value: string, todayParts: DateParts): DateParts {
  const parsed = parseDateInput(value);

  if (parsed && formatDateParts(parsed) <= formatDateParts(todayParts)) {
    return parsed;
  }

  return {
    year: Math.min(DEFAULT_BIRTHDAY_YEAR, todayParts.year),
    month: 1,
    day: 1,
  };
}

function clampBirthdayParts(parts: DateParts, todayParts: DateParts): DateParts {
  const year = Math.min(Math.max(parts.year, MIN_BIRTHDAY_YEAR), todayParts.year);
  const maxMonth = year === todayParts.year ? todayParts.month : 12;
  const month = Math.min(Math.max(parts.month, 1), maxMonth);
  const maxDay =
    year === todayParts.year && month === todayParts.month
      ? todayParts.day
      : getDaysInMonth(year, month);
  const day = Math.min(Math.max(parts.day, 1), maxDay);

  return { year, month, day };
}

function resolveAvatarUri(avatar: string | null, localPreviewUri: string | null): string | null {
  if (localPreviewUri) {
    return localPreviewUri;
  }

  if (!avatar) {
    return null;
  }

  if (/^https?:\/\//i.test(avatar)) {
    return avatar;
  }

  const apiOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${apiOrigin}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
}

function buildAvatarFormData(asset: Asset): FormData {
  if (!asset.uri) {
    throw new Error('未读取到头像文件，请重新选择。');
  }

  const formData = new FormData();
  const fileName =
    asset.fileName?.trim() || `avatar-${Date.now()}.${asset.type?.split('/')[1] ?? 'jpg'}`;

  formData.append('file', {
    uri: asset.uri,
    type: asset.type ?? 'image/jpeg',
    name: fileName,
  } as any);

  return formData;
}

function validateImagePickerResult(result: ImagePickerResponse): Asset | null {
  if (result.didCancel) {
    return null;
  }

  if (result.errorCode) {
    throw new Error(result.errorMessage ?? '选择头像失败，请稍后重试。');
  }

  const asset = result.assets?.[0];

  if (!asset?.uri) {
    throw new Error('未读取到头像文件，请重新选择。');
  }

  return asset;
}

export function SetupProfileScreen() {
  const user = useAuthStore(state => state.user);
  const updateProfile = useUserStore(state => state.updateProfile);
  const { isTablet, palette, typography } = useAppTheme();
  const { isTabletLandscape } = useDeviceType();
  const { t } = useI18n();
  const todayDate = formatDateInput(new Date());
  const todayParts = parseDateInput(todayDate) ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };

  const [nickname, setNickname] = useState(user?.nickname ?? user?.email.split('@')[0] ?? '');
  const [birthday, setBirthday] = useState(user?.birthday?.slice(0, 10) ?? '');
  const [birthdayPickerVisible, setBirthdayPickerVisible] = useState(false);
  const [birthdayDraft, setBirthdayDraft] = useState<DateParts>(() =>
    getInitialBirthdayParts(user?.birthday?.slice(0, 10) ?? '', todayParts),
  );
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [localAvatarPreviewUri, setLocalAvatarPreviewUri] = useState<string | null>(null);
  const [nicknameTouched, setNicknameTouched] = useState(false);
  const [birthdayTouched, setBirthdayTouched] = useState(false);
  const [bioTouched, setBioTouched] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const trimmedNickname = nickname.trim();
  const trimmedBirthday = birthday.trim();
  const trimmedBio = bio.trim();

  const nicknameError = useMemo(() => {
    if (trimmedNickname.length === 0) {
      return t('请输入昵称');
    }

    if (trimmedNickname.length > NICKNAME_MAX_LENGTH) {
      return t('昵称最多50个字符');
    }

    return null;
  }, [t, trimmedNickname]);

  const birthdayError = useMemo(() => {
    if (trimmedBirthday.length === 0) {
      return t('请选择生日');
    }

    if (!isValidDateInput(trimmedBirthday)) {
      return t('生日格式需为 YYYY-MM-DD');
    }

    if (trimmedBirthday > todayDate) {
      return t('生日不能晚于今天');
    }

    return null;
  }, [t, todayDate, trimmedBirthday]);

  const bioError = useMemo(() => {
    if (trimmedBio.length > BIO_MAX_LENGTH) {
      return t('简介最多200个字符');
    }

    return null;
  }, [t, trimmedBio.length]);

  const avatarUri = resolveAvatarUri(avatar, localAvatarPreviewUri);
  const avatarFallback = getAvatarFallback(user?.email, trimmedNickname);
  const birthdayYearOptions = useMemo(() => {
    const years = buildNumberRange(MIN_BIRTHDAY_YEAR, todayParts.year);
    return years.reverse();
  }, [todayParts.year]);
  const birthdayMonthOptions = useMemo(() => {
    const maxMonth = birthdayDraft.year === todayParts.year ? todayParts.month : 12;
    return buildNumberRange(1, maxMonth);
  }, [birthdayDraft.year, todayParts.month, todayParts.year]);
  const birthdayDayOptions = useMemo(() => {
    const maxDay =
      birthdayDraft.year === todayParts.year && birthdayDraft.month === todayParts.month
        ? todayParts.day
        : getDaysInMonth(birthdayDraft.year, birthdayDraft.month);
    return buildNumberRange(1, maxDay);
  }, [birthdayDraft.month, birthdayDraft.year, todayParts.day, todayParts.month, todayParts.year]);

  const openBirthdayPicker = () => {
    setBirthdayDraft(getInitialBirthdayParts(trimmedBirthday, todayParts));
    setBirthdayTouched(true);
    setFeedback(null);
    setBirthdayPickerVisible(true);
  };

  const updateBirthdayDraft = (nextParts: DateParts) => {
    setBirthdayDraft(clampBirthdayParts(nextParts, todayParts));
  };

  const confirmBirthdayPicker = () => {
    const selectedBirthday = formatDateParts(clampBirthdayParts(birthdayDraft, todayParts));
    setBirthday(selectedBirthday);
    setBirthdayTouched(true);
    setFeedback(null);
    setBirthdayPickerVisible(false);
  };

  const handlePickAvatar = async () => {
    setFeedback(null);
    setUploadingAvatar(true);

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
        includeBase64: false,
      });
      const asset = validateImagePickerResult(result);

      if (!asset) {
        return;
      }

      const uploadResponse = await fileApi.uploadFile(buildAvatarFormData(asset));

      setAvatar(uploadResponse.url);
      setLocalAvatarPreviewUri(asset.uri ?? null);
      setFeedback({
        status: 'success',
        title: t('头像已上传'),
        description: t('保存资料后将作为你的个人头像显示。'),
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('头像上传失败'),
        description: getErrorMessage(error, t('头像上传失败，请稍后重试。')),
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    setNicknameTouched(true);
    setBirthdayTouched(true);
    setBioTouched(true);
    setFeedback(null);

    if (nicknameError || birthdayError || bioError) {
      return;
    }

    setSubmitting(true);

    try {
      await updateProfile({
        nickname: trimmedNickname,
        birthday: trimmedBirthday,
        bio: trimmedBio.length > 0 ? trimmedBio : null,
        avatar,
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('资料保存失败'),
        description: getErrorMessage(error, t('资料保存失败，请稍后重试。')),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center px-6 py-10">
            <View className={`w-full ${isTablet ? 'mx-auto' : ''}`} style={isTablet ? { maxWidth: isTabletLandscape ? 560 : 420 } : undefined}>
              <View className="items-center gap-2">
                <Text className={`${typography.h2} text-center text-foreground`}>
                  {t('完善个人资料')}
                </Text>
                <Text className={`${typography.body} text-center text-foreground/70`}>
                  {t('首次登录需要补充昵称和生日，简介可选，完成后会自动进入主界面。')}
                </Text>
                <Text className={`${typography.bodySmall} text-center text-foreground/55`}>
                  {user?.email ?? t('未获取到邮箱')}
                </Text>
              </View>

              <View className="mt-8 gap-5">
                {feedback ? (
                  <Alert status={feedback.status}>
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{feedback.title}</Alert.Title>
                      <Alert.Description>{feedback.description}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}

                <View className="items-center gap-3">
                  <Pressable
                    accessibilityRole="button"
                    className="items-center gap-3"
                    disabled={uploadingAvatar}
                    onPress={() => {
                      void handlePickAvatar();
                    }}>
                    <View className="relative">
                      <Avatar alt={t('用户头像')} className="h-28 w-28" color="accent" size="lg">
                        {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
                        <Avatar.Fallback>{avatarFallback}</Avatar.Fallback>
                      </Avatar>
                      {uploadingAvatar ? (
                        <View className="absolute inset-0 items-center justify-center rounded-full bg-background/70">
                          <Spinner color="default" size="sm" />
                        </View>
                      ) : null}
                    </View>
                    <Text className={`${typography.bodySmall} text-primary`}>
                      {uploadingAvatar ? t('正在上传头像...') : t('点击选择头像')}
                    </Text>
                  </Pressable>
                </View>

                <TextField isRequired isInvalid={nicknameTouched && nicknameError !== null}>
                  <Label>{t('昵称')}</Label>
                  <Input
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={NICKNAME_MAX_LENGTH}
                    placeholder={t('请输入昵称')}
                    returnKeyType="next"
                    textContentType="nickname"
                    value={nickname}
                    onBlur={() => setNicknameTouched(true)}
                    onChangeText={value => {
                      setNickname(value);
                      setFeedback(null);
                    }}
                  />
                  <FieldError>{nicknameError ?? ''}</FieldError>
                </TextField>

                <TextField isRequired isInvalid={birthdayTouched && birthdayError !== null}>
                  <Label>{t('生日')}</Label>
                  <Pressable
                    accessibilityLabel={t('选择生日')}
                    accessibilityRole="button"
                    className="min-h-12 flex-row items-center justify-between rounded-2xl border px-4 py-3"
                    onPress={openBirthdayPicker}
                    style={{
                      backgroundColor: palette.elevated,
                      borderColor:
                        birthdayTouched && birthdayError
                          ? palette.danger
                          : withAlpha(palette.primary, 0.12),
                    }}>
                    <Text
                      className={typography.body}
                      style={{ color: birthday ? palette.text : palette.placeholder }}>
                      {birthday || t('请选择生日')}
                    </Text>
                    <AppIcon color={palette.textSoft} name="chevron-right" size={18} />
                  </Pressable>
                  <FieldError>{birthdayError ?? ''}</FieldError>
                </TextField>

                <TextField isInvalid={bioTouched && bioError !== null}>
                  <Label>{t('简介')}</Label>
                  <TextArea
                    maxLength={BIO_MAX_LENGTH}
                    numberOfLines={4}
                    placeholder={t(DEFAULT_BIO_PLACEHOLDER)}
                    value={bio}
                    onBlur={() => setBioTouched(true)}
                    onChangeText={value => {
                      setBio(value);
                      setFeedback(null);
                    }}
                  />
                  <View className="flex-row items-center justify-between gap-3">
                    <FieldError>{bioError ?? ''}</FieldError>
                    <Text className={`${typography.bodySmall} text-foreground/45`}>
                      {trimmedBio.length}/{BIO_MAX_LENGTH}
                    </Text>
                  </View>
                </TextField>

                <Button
                  isDisabled={submitting || uploadingAvatar}
                  size="lg"
                  variant="primary"
                  onPress={() => {
                    void handleSubmit();
                  }}>
                  {submitting ? (
                    <>
                      <Spinner color="default" size="sm" />
                      <Button.Label>{t('保存中...')}</Button.Label>
                    </>
                  ) : (
                    t('完成')
                  )}
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
        <Modal
          animationType="fade"
          transparent
          visible={birthdayPickerVisible}
          onRequestClose={() => setBirthdayPickerVisible(false)}>
          <Pressable
            className="flex-1 justify-end px-4 pb-6"
            onPress={() => setBirthdayPickerVisible(false)}
            style={{ backgroundColor: palette.overlay }}>
            <Pressable
              className="rounded-[24px] border px-4 py-4"
              onPress={event => event.stopPropagation()}
              style={{
                backgroundColor: palette.surface,
                borderColor: withAlpha(palette.primary, 0.18),
                shadowColor: palette.shadow,
                shadowOpacity: 0.22,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 18,
              }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className={typography.h3} style={{ color: palette.text }}>
                    {t('选择生日')}
                  </Text>
                  <Text className={`${typography.bodySmall} mt-1`} style={{ color: palette.textSoft }}>
                    {formatDateParts(birthdayDraft)}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={t('关闭')}
                  accessibilityRole="button"
                  className="h-10 w-10 items-center justify-center rounded-full"
                  onPress={() => setBirthdayPickerVisible(false)}
                  style={{ backgroundColor: palette.panelInset }}>
                  <AppIcon color={palette.textSoft} name="x" size={18} />
                </Pressable>
              </View>

              <View className="mt-4 flex-row gap-2">
                <View className="min-w-0 flex-1">
                  <Text className={`${typography.bodySmall} mb-2 text-center`} style={{ color: palette.textSoft }}>
                    {t('年')}
                  </Text>
                  <ScrollView
                    className="max-h-56 rounded-2xl"
                    showsVerticalScrollIndicator={false}
                    style={{ backgroundColor: palette.panelInset }}>
                    {birthdayYearOptions.map(year => {
                      const isSelected = year === birthdayDraft.year;

                      return (
                        <Pressable
                          key={year}
                          className="h-11 items-center justify-center"
                          onPress={() =>
                            updateBirthdayDraft({
                              ...birthdayDraft,
                              year,
                            })
                          }
                          style={{
                            backgroundColor: isSelected
                              ? withAlpha(palette.primary, 0.16)
                              : 'transparent',
                          }}>
                          <Text
                            className={typography.body}
                            style={{ color: isSelected ? palette.primary : palette.text }}>
                            {year}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View className="min-w-0 flex-1">
                  <Text className={`${typography.bodySmall} mb-2 text-center`} style={{ color: palette.textSoft }}>
                    {t('月')}
                  </Text>
                  <ScrollView
                    className="max-h-56 rounded-2xl"
                    showsVerticalScrollIndicator={false}
                    style={{ backgroundColor: palette.panelInset }}>
                    {birthdayMonthOptions.map(month => {
                      const isSelected = month === birthdayDraft.month;

                      return (
                        <Pressable
                          key={month}
                          className="h-11 items-center justify-center"
                          onPress={() =>
                            updateBirthdayDraft({
                              ...birthdayDraft,
                              month,
                            })
                          }
                          style={{
                            backgroundColor: isSelected
                              ? withAlpha(palette.primary, 0.16)
                              : 'transparent',
                          }}>
                          <Text
                            className={typography.body}
                            style={{ color: isSelected ? palette.primary : palette.text }}>
                            {String(month).padStart(2, '0')}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View className="min-w-0 flex-1">
                  <Text className={`${typography.bodySmall} mb-2 text-center`} style={{ color: palette.textSoft }}>
                    {t('日')}
                  </Text>
                  <ScrollView
                    className="max-h-56 rounded-2xl"
                    showsVerticalScrollIndicator={false}
                    style={{ backgroundColor: palette.panelInset }}>
                    {birthdayDayOptions.map(day => {
                      const isSelected = day === birthdayDraft.day;

                      return (
                        <Pressable
                          key={day}
                          className="h-11 items-center justify-center"
                          onPress={() =>
                            updateBirthdayDraft({
                              ...birthdayDraft,
                              day,
                            })
                          }
                          style={{
                            backgroundColor: isSelected
                              ? withAlpha(palette.primary, 0.16)
                              : 'transparent',
                          }}>
                          <Text
                            className={typography.body}
                            style={{ color: isSelected ? palette.primary : palette.text }}>
                            {String(day).padStart(2, '0')}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              <View className="mt-4 flex-row gap-3">
                <Button
                  className="flex-1"
                  variant="outline"
                  onPress={() => setBirthdayPickerVisible(false)}>
                  {t('取消')}
                </Button>
                <Button className="flex-1" variant="primary" onPress={confirmBirthdayPicker}>
                  {t('完成')}
                </Button>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
