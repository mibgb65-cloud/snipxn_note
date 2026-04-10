import {
  Alert,
  Avatar,
  Button,
  FieldError,
  Input,
  Label,
  Separator,
  Spinner,
  TextArea,
  TextField,
} from 'heroui-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert as RNAlert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { getBuildNumber, getVersion } from 'react-native-device-info';
import {
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '../../api/axios';
import { AppIcon, type AppIconName } from '../../components/common/AppIcon';
import {
  APP_FADE_IN,
  APP_LAYOUT_TRANSITION,
  APP_PANEL_ENTERING,
  MotionPressable,
} from '../../components/common/AppMotion';
import * as fileApi from '../../api/file';
import * as userApi from '../../api/user';
import { buildGitHubAuthorizeUrl } from '../../config/oauth';
import { signInWithGoogle } from '../../services/googleSignIn';
import { useDeviceType } from '../../hooks';
import { useI18n } from '../../i18n';
import { useShallow } from 'zustand/react/shallow';

import { useAppUpdateStore, useAuthStore, useUserStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';
import type { LinkedAccount, StorageBreakdownResponse, User, UserDevice } from '../../types';
import {
  buildUpdateMessage,
  CODE_FONT_SIZE_OPTIONS,
  DEFAULT_CODE_FONT_SIZE,
  formatInstalledVersionLabel,
  formatRelativeTime,
  getStoredCodeFontSize,
  setStoredCodeFontSize,
  type AppLanguage,
} from '../../utils';

type SettingsSectionKey =
  | 'profile'
  | 'security'
  | 'devices'
  | 'preferences'
  | 'storage'
  | 'about'
  | 'logout';

type FeedbackState = {
  status: 'success' | 'warning' | 'danger' | 'accent';
  title: string;
  description: string;
} | null;

const PROFILE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getSectionTitles(t: (text: string) => string): Record<SettingsSectionKey, string> {
  return {
    profile: t('个人资料'),
    security: t('账号安全'),
    devices: t('设备管理'),
    preferences: t('偏好设置'),
    storage: t('存储空间'),
    about: t('关于与反馈'),
    logout: t('退出登录'),
  };
}

function getLanguageOptions(
  t: (text: string) => string,
): Array<{ label: string; value: AppLanguage; description: string }> {
  return [
    {
      label: t('简体中文'),
      value: 'zh-CN',
      description: t('当前默认语言，后续 i18n 文案会逐步覆盖。'),
    },
    {
      label: 'English',
      value: 'en-US',
      description: t('切换到英文界面，主要页面已支持英语。'),
    },
  ];
}

function getFontSizeOptions(t: (text: string) => string) {
  return [
    {
      label: t('小'),
      value: CODE_FONT_SIZE_OPTIONS[0],
      description: t('适合一屏显示更多代码'),
    },
    {
      label: t('中'),
      value: CODE_FONT_SIZE_OPTIONS[1],
      description: t('默认推荐字号'),
    },
    {
      label: t('大'),
      value: CODE_FONT_SIZE_OPTIONS[2],
      description: t('更适合平板或长时间阅读'),
    },
  ] as const;
}

function getProfileGenderOptions(t: (text: string) => string) {
  return [
    { label: t('不展示'), value: 0, description: t('默认，不额外展示性别信息') },
    { label: t('男'), value: 1, description: t('在个人资料中展示为男性') },
    { label: t('女'), value: 2, description: t('在个人资料中展示为女性') },
  ] as const;
}

function getLinkedAccountOptions(
  t: (text: string) => string,
): Array<{
  identityType: LinkedAccount['identityType'];
  label: string;
}> {
  return [
    { identityType: 'PASSWORD', label: t('密码登录') },
    { identityType: 'GITHUB', label: 'GitHub' },
    { identityType: 'GOOGLE', label: 'Google' },
  ];
}

function getStorageLabels(t: (text: string) => string): Record<string, string> {
  return {
    attachments: t('附件'),
    code: t('代码片段'),
    files: t('文件'),
    images: t('图片'),
    limit: t('配额'),
    markdown: 'Markdown',
    notes: t('笔记'),
    other: t('其他'),
    storageLimit: t('容量上限'),
    storageUsed: t('已用空间'),
    total: t('总计'),
    totalSize: t('总大小'),
    used: t('已使用'),
  };
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

function getAvatarFallback(email: string | undefined, nickname: string): string {
  const source = nickname.trim() || email?.trim() || 'S';
  return source.slice(0, 1).toUpperCase();
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
  const fileName = asset.fileName?.trim() || `avatar-${Date.now()}.${asset.type?.split('/')[1] ?? 'jpg'}`;

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

function normalizeStorageEntries(
  storageBreakdown: StorageBreakdownResponse | null,
  storageLabels: Record<string, string>,
  language: AppLanguage,
) {
  if (!storageBreakdown || typeof storageBreakdown !== 'object') {
    return [];
  }

  return Object.entries(storageBreakdown)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({
      key,
      label:
        storageLabels[key] ??
        key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' '),
      value:
        typeof value === 'number'
          ? /size|storage|limit|used|bytes?/i.test(key)
            ? formatBytes(value)
            : value.toLocaleString(language)
          : Array.isArray(value)
            ? language === 'en-US'
              ? `${value.length} items`
              : `${value.length} 项`
            : typeof value === 'boolean'
              ? value
                ? language === 'en-US'
                  ? 'Yes'
                  : '是'
                : language === 'en-US'
                  ? 'No'
                  : '否'
              : typeof value === 'string'
                ? value
                : language === 'en-US'
                  ? 'Object returned'
                  : '已返回对象',
    }));
}

function normalizeProfileValue(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function formatJoinedAtLabel(
  value: string | null | undefined,
  language: AppLanguage,
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(language, {
    year: 'numeric',
    month: language === 'en-US' ? 'short' : 'long',
    day: 'numeric',
  });
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { palette } = useAppTheme();

  return (
    <View
      className="rounded-[12px] border px-5 py-5"
      style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
      <View className="gap-1">
        <Text className="text-lg font-semibold" style={{ color: palette.text }}>
          {title}
        </Text>
        {description ? (
          <Text className="text-sm" style={{ color: palette.textSoft }}>
            {description}
          </Text>
        ) : null}
      </View>
      <View className="mt-5 gap-4">{children}</View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { palette } = useAppTheme();

  return (
    <View
      className="flex-row items-center justify-between gap-4 rounded-2xl px-4 py-3"
      style={{ backgroundColor: palette.surfaceAlt }}>
      <Text className="text-sm" style={{ color: palette.textSoft }}>
        {label}
      </Text>
      <Text className="flex-1 text-right text-sm" style={{ color: palette.text }}>
        {value}
      </Text>
    </View>
  );
}

function SelectButton({
  active,
  label,
  description,
  onPress,
}: {
  active: boolean;
  label: string;
  description?: string;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <MotionPressable
      className="rounded-2xl border px-4 py-3"
      pressedScale={0.985}
      style={{
        borderColor: active ? withAlpha(palette.primary, 0.36) : palette.border,
        backgroundColor: active ? palette.primarySoft : palette.surfaceAlt,
      }}
      onPress={onPress}>
      <Text className="text-sm font-semibold" style={{ color: palette.text }}>
        {label}
      </Text>
      {description ? (
        <Text className="mt-1 text-xs" style={{ color: palette.textSoft }}>
          {description}
        </Text>
      ) : null}
    </MotionPressable>
  );
}

function MenuItem({
  label,
  active,
  destructive = false,
  onPress,
}: {
  label: string;
  active: boolean;
  destructive?: boolean;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <MotionPressable
      className="rounded-2xl px-4 py-3"
      pressedScale={0.985}
      onPress={onPress}
      style={{ backgroundColor: active ? palette.primarySoft : palette.surfaceAlt }}>
      <Text
        className="text-sm font-medium"
        style={{ color: destructive ? palette.danger : palette.text }}>
        {label}
      </Text>
    </MotionPressable>
  );
}

function renderButtonContent(isLoading: boolean, loadingLabel: string, idleLabel: string) {
  if (isLoading) {
    return (
      <>
        <Spinner color="default" size="sm" />
        <Button.Label>{loadingLabel}</Button.Label>
      </>
    );
  }

  return <Button.Label>{idleLabel}</Button.Label>;
}

export function SettingsScreen() {
  const { isTablet } = useDeviceType();
  const { palette, theme, themePreference, setThemePreference, typography } = useAppTheme();
  const { isEnglish, language, setLanguage, t } = useI18n();
  const safeAreaEdges = isTablet ? (['top', 'left', 'right'] as const) : undefined;
  const { authUser, logout } = useAuthStore(useShallow(state => ({
    authUser: state.user,
    logout: state.logout,
  })));
  const { checkForUpdates, latestVersionInfo } = useAppUpdateStore(useShallow(state => ({
    checkForUpdates: state.checkForUpdates,
    latestVersionInfo: state.latestVersionInfo,
  })));
  const {
    profile,
    devices,
    linkedAccounts,
    storageBreakdown,
    fetchProfile,
    updateProfile,
    changePassword,
    fetchDevices,
    revokeDevice,
    revokeOtherDevices,
    fetchLinkedAccounts,
    fetchStorageBreakdown,
  } = useUserStore(useShallow(state => ({
    profile: state.profile,
    devices: state.devices,
    linkedAccounts: state.linkedAccounts,
    storageBreakdown: state.storageBreakdown,
    fetchProfile: state.fetchProfile,
    updateProfile: state.updateProfile,
    changePassword: state.changePassword,
    fetchDevices: state.fetchDevices,
    revokeDevice: state.revokeDevice,
    revokeOtherDevices: state.revokeOtherDevices,
    fetchLinkedAccounts: state.fetchLinkedAccounts,
    fetchStorageBreakdown: state.fetchStorageBreakdown,
  })));

  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('profile');
  const [mobileSection, setMobileSection] = useState<SettingsSectionKey | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [initializing, setInitializing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [gender, setGender] = useState(0);
  const [birthday, setBirthday] = useState('');
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [techStack, setTechStack] = useState('');
  const [localAvatarPreviewUri, setLocalAvatarPreviewUri] = useState<string | null>(null);
  const [nicknameTouched, setNicknameTouched] = useState(false);
  const [birthdayTouched, setBirthdayTouched] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [processingDeviceId, setProcessingDeviceId] = useState<string | null>(null);
  const [processingAccount, setProcessingAccount] = useState<LinkedAccount['identityType'] | null>(null);
  const [codeFontSize, setCodeFontSize] = useState<number>(DEFAULT_CODE_FONT_SIZE);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const sectionTitles = useMemo(() => getSectionTitles(t), [t]);
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  const fontSizeOptions = useMemo(() => getFontSizeOptions(t), [t]);
  const profileGenderOptions = useMemo(() => getProfileGenderOptions(t), [t]);
  const linkedAccountOptions = useMemo(() => getLinkedAccountOptions(t), [t]);
  const storageLabels = useMemo(() => getStorageLabels(t), [t]);

  const mobileMenuItems: Array<{
    key: SettingsSectionKey;
    icon: AppIconName;
    description: string;
    danger?: boolean;
  }> = useMemo(() => [
    { key: 'profile', icon: 'user', description: t('昵称、头像与社区展示资料') },
    { key: 'security', icon: 'shield', description: t('密码修改与第三方账号绑定') },
    { key: 'devices', icon: 'devices', description: t('查看已登录设备') },
    { key: 'preferences', icon: 'settings', description: t('主题、语言与代码字号') },
    { key: 'storage', icon: 'database', description: t('配额使用与存储明细') },
    { key: 'about', icon: 'info', description: t('版本信息、检查更新与反馈') },
    { key: 'logout', icon: 'log-out', description: '', danger: true },
  ], [t]);

  const currentUser: User | null = profile ?? authUser;
  const avatarUri = resolveAvatarUri(avatar, localAvatarPreviewUri);
  const avatarFallback = getAvatarFallback(currentUser?.email, nickname);
  const storageUsed = currentUser?.storageUsed ?? 0;
  const storageLimit = currentUser?.storageLimit ?? 0;
  const storageProgress = storageLimit > 0 ? Math.min(storageUsed / storageLimit, 1) : 0;
  const nicknameError = nicknameTouched && nickname.trim().length === 0 ? t('昵称不能为空') : null;
  const normalizedBirthday = birthday.trim();
  const birthdayError =
    birthdayTouched &&
    normalizedBirthday.length > 0 &&
    !PROFILE_DATE_PATTERN.test(normalizedBirthday)
      ? t('生日格式需为 YYYY-MM-DD')
      : null;
  const passwordError =
    passwordTouched && password.trim().length < 6 ? t('新密码至少需要 6 位') : null;
  const linkedAccountSet = useMemo(
    () => new Set(linkedAccounts.map(account => account.identityType)),
    [linkedAccounts],
  );
  const storageEntries = useMemo(
    () => normalizeStorageEntries(storageBreakdown, storageLabels, language),
    [language, storageBreakdown, storageLabels],
  );
  const joinedAtLabel = useMemo(
    () => formatJoinedAtLabel(currentUser?.createdAt, language),
    [currentUser?.createdAt, language],
  );
  const currentVersionLabel = useMemo(
    () => formatInstalledVersionLabel(getVersion(), getBuildNumber()),
    [],
  );
  const latestVersionLabel = latestVersionInfo
    ? formatInstalledVersionLabel(latestVersionInfo.version, latestVersionInfo.buildNumber)
    : null;

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setNickname(currentUser.nickname ?? currentUser.email.split('@')[0] ?? '');
    setBio(currentUser.bio ?? '');
    setAvatar(currentUser.avatar ?? null);
    setGender(currentUser.gender ?? 0);
    setBirthday(currentUser.birthday ?? '');
    setWebsite(currentUser.website ?? '');
    setGithub(currentUser.github ?? '');
    setLocation(currentUser.location ?? '');
    setCompany(currentUser.company ?? '');
    setTechStack(currentUser.techStack ?? '');
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedCodeFontSize = await getStoredCodeFontSize();

        if (isMounted) {
          setCodeFontSize(storedCodeFontSize);
        }
      } catch {
        // Ignore preference hydration failures.
      }

      try {
        await Promise.all([
          fetchProfile(),
          fetchDevices(),
          fetchLinkedAccounts(),
          fetchStorageBreakdown(),
        ]);
      } catch (error) {
        if (isMounted) {
          setFeedback({
            status: 'warning',
            title: t('部分设置未刷新'),
            description: getErrorMessage(error, t('部分设置读取失败，请稍后重试。')),
          });
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, [fetchDevices, fetchLinkedAccounts, fetchProfile, fetchStorageBreakdown, t]);

  const refreshData = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchProfile(),
        fetchDevices(),
        fetchLinkedAccounts(),
        fetchStorageBreakdown(),
      ]);
      setFeedback({
        status: 'success',
        title: t('设置已刷新'),
        description: t('账号信息和本地偏好已经更新。'),
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('刷新失败'),
        description: getErrorMessage(error, t('设置刷新失败，请稍后重试。')),
      });
    } finally {
      setRefreshing(false);
    }
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
        description: t('点击保存资料后，新的头像会同步到个人主页和社区。'),
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

  const handleSaveProfile = async () => {
    setNicknameTouched(true);
    setBirthdayTouched(true);
    setFeedback(null);

    if (nickname.trim().length === 0 || birthdayError !== null) {
      return;
    }

    setSavingProfile(true);

    try {
      await updateProfile({
        nickname: nickname.trim(),
        bio: normalizeProfileValue(bio),
        avatar,
        gender,
        birthday: normalizeProfileValue(birthday),
        website: normalizeProfileValue(website),
        github: normalizeProfileValue(github),
        location: normalizeProfileValue(location),
        company: normalizeProfileValue(company),
        techStack: normalizeProfileValue(techStack),
      });
      setFeedback({
        status: 'success',
        title: isEnglish ? 'Profile updated' : '资料已更新',
        description: t('新的昵称、头像和社区展示资料已经保存。'),
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: isEnglish ? 'Failed to save profile' : '保存资料失败',
        description: getErrorMessage(error, t('资料保存失败，请稍后重试。')),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordTouched(true);
    setFeedback(null);

    if (password.trim().length < 6) {
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(password.trim());
      setPassword('');
      setPasswordTouched(false);
      setFeedback({
        status: 'success',
        title: t('密码已更新'),
        description: t('下次登录时请使用新的密码。'),
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('修改密码失败'),
        description: getErrorMessage(error, t('修改密码失败，请稍后重试。')),
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUnlinkAccount = async (identityType: LinkedAccount['identityType']) => {
    setProcessingAccount(identityType);
    setFeedback(null);

    try {
      await userApi.unlinkAccount(identityType);
      await fetchLinkedAccounts();
      setFeedback({
        status: 'success',
        title: t('账号已解绑'),
        description: isEnglish
          ? `${linkedAccountOptions.find(option => option.identityType === identityType)?.label ?? identityType} has been removed from this account.`
          : `${linkedAccountOptions.find(option => option.identityType === identityType)?.label ?? identityType} 已从当前账号移除。`,
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('解绑失败'),
        description: getErrorMessage(error, t('解绑失败，请稍后重试。')),
      });
    } finally {
      setProcessingAccount(null);
    }
  };

  const handleRequestBindAccount = (identityType: LinkedAccount['identityType']) => {
    if (identityType === 'GITHUB') {
      Linking.openURL(buildGitHubAuthorizeUrl('bind')).catch(() => {
        setFeedback({
          status: 'danger',
          title: t('无法打开浏览器'),
          description: t('请检查系统设置后重试。'),
        });
      });
      return;
    }

    (async () => {
      try {
        const serverAuthCode = await signInWithGoogle();
        await userApi.bindGoogle(serverAuthCode, '');

        const { useUserStore } = await import('../../stores/userStore');
        await useUserStore.getState().fetchLinkedAccounts();

        RNAlert.alert('Google', t('绑定成功'));
      } catch (error) {
        const message = error instanceof Error ? error.message : t('绑定失败，请稍后重试。');
        setFeedback({
          status: 'danger',
          title: t('绑定失败'),
          description: message,
        });
      }
    })();
  };

  const handleRevokeDevice = async (device: UserDevice) => {
    setProcessingDeviceId(device.deviceId);
    setFeedback(null);

    try {
      await revokeDevice(device.deviceId);
      setFeedback({
        status: 'success',
        title: t('设备已移除'),
        description: isEnglish
          ? `${device.deviceName ?? device.deviceId} has been removed from signed-in devices.`
          : `${device.deviceName ?? device.deviceId} 已从登录设备列表中移除。`,
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('移除设备失败'),
        description: getErrorMessage(error, t('移除设备失败，请稍后重试。')),
      });
    } finally {
      setProcessingDeviceId(null);
    }
  };

  const handleRevokeOtherDevices = async () => {
    setProcessingDeviceId('__others__');
    setFeedback(null);

    try {
      await revokeOtherDevices();
      await fetchDevices();
      setFeedback({
        status: 'success',
        title: t('其他设备已下线'),
        description: t('除当前设备外的会话已全部撤销。'),
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('批量下线失败'),
        description: getErrorMessage(error, t('批量下线失败，请稍后重试。')),
      });
    } finally {
      setProcessingDeviceId(null);
    }
  };

  const handleSelectLanguage = async (nextLanguage: AppLanguage) => {
    setSavingPreferences(true);

    try {
      await setLanguage(nextLanguage);
      setFeedback({
        status: 'success',
        title: t('语言偏好已保存'),
        description: isEnglish
          ? 'The selected language is active now.'
          : '新的语言偏好会在后续国际化接入时自动生效。',
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('保存语言偏好失败'),
        description: getErrorMessage(error, t('保存语言偏好失败，请稍后重试。')),
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSelectCodeFontSize = async (nextFontSize: number) => {
    setCodeFontSize(nextFontSize);
    setSavingPreferences(true);

    try {
      await setStoredCodeFontSize(nextFontSize);
      setFeedback({
        status: 'success',
        title: t('代码字号已保存'),
        description: t('新的字号偏好已写入本地，后续编辑器会优先读取它。'),
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('保存字号偏好失败'),
        description: getErrorMessage(error, t('保存字号偏好失败，请稍后重试。')),
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    setFeedback(null);

    try {
      const result = await checkForUpdates();

      if (result.status === 'up_to_date') {
        setFeedback({
          status: 'success',
          title: t('已经是最新版本'),
          description:
            result.message ??
            (isEnglish
              ? `Current version ${currentVersionLabel} is up to date.`
              : `当前版本 ${currentVersionLabel} 已是最新版本。`),
        });
        return;
      }

      if (result.status === 'update_available') {
        const latestInfo = result.latestVersionInfo ?? latestVersionInfo;
        const latestLabel = latestInfo
          ? formatInstalledVersionLabel(latestInfo.version, latestInfo.buildNumber)
          : t('新版本');

        setFeedback({
          status: 'accent',
          title: t('发现新版本'),
          description:
            result.message ??
            (latestInfo
              ? buildUpdateMessage(latestInfo, language)
              : isEnglish
                ? `Version ${latestLabel} is available.`
                : `发现新版本 ${latestLabel}。`),
        });
        return;
      }

      setFeedback({
        status: 'danger',
        title: t('检查更新失败'),
        description: result.message ?? t('检查更新失败，请稍后重试。'),
      });
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleSendFeedback = async () => {
    const message = feedbackText.trim();

    if (message.length === 0) {
      setFeedback({
        status: 'warning',
        title: t('反馈内容为空'),
        description: t('请先填写你想反馈的问题或建议。'),
      });
      return;
    }

    setSubmittingFeedback(true);

    try {
      await Share.share({
        title: 'Snipxn Feedback',
        message: isEnglish
          ? `Snipxn Mobile Feedback\n\nVersion: ${currentVersionLabel}\nTheme: ${themePreference}\nLanguage: ${language}\nCode Font Size: ${codeFontSize}\n\n${message}`
          : `Snipxn 移动端反馈\n\n版本: ${currentVersionLabel}\n主题: ${themePreference}\n语言偏好: ${language}\n代码字号: ${codeFontSize}\n\n${message}`,
      });
      setFeedbackText('');
      setFeedback({
        status: 'success',
        title: t('反馈已准备好'),
        description: t('系统分享面板已打开，你可以选择合适的发送渠道。'),
      });
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('反馈发送失败'),
        description: getErrorMessage(error, t('反馈发送失败，请稍后重试。')),
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const renderProfileSection = () => (
    <SectionShell title={t('个人资料')} description={t('这些资料会同步到社区主页、账号设置和侧边栏展示。')}>
      <View className={`gap-5 ${isTablet ? 'flex-row items-start' : ''}`}>
        <MotionPressable
          className="items-center gap-3"
          disabled={uploadingAvatar}
          onPress={() => void handlePickAvatar()}>
          <View className="relative">
            <Avatar alt={t('用户头像')} className="h-24 w-24" color="accent" size="lg">
              {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
              <Avatar.Fallback>{avatarFallback}</Avatar.Fallback>
            </Avatar>
            {uploadingAvatar ? (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-background/70">
                <Spinner color="default" size="sm" />
              </View>
            ) : null}
          </View>
          <Text className="text-xs text-primary">
            {uploadingAvatar ? t('正在上传头像...') : (isEnglish ? 'Tap to change avatar' : '点击更换头像')}
          </Text>
        </MotionPressable>

        <View className="min-w-0 flex-1 gap-4">
          <View className="rounded-2xl bg-background px-4 py-3">
            <Text className="text-sm text-foreground/60">{t('登录邮箱')}</Text>
            <Text className="mt-1 text-sm text-foreground">
              {currentUser?.email ?? t('未获取到邮箱')}
            </Text>
            {joinedAtLabel ? (
              <Text className="mt-2 text-xs text-foreground/50">{`${t('加入时间：')}${joinedAtLabel}`}</Text>
            ) : null}
          </View>

          <TextField isRequired isInvalid={nicknameError !== null}>
            <Label>{t('昵称')}</Label>
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('请输入昵称')}
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

          <TextField>
            <Label>{t('简介')}</Label>
            <TextArea
              numberOfLines={4}
              placeholder={t('一句话介绍自己')}
              value={bio}
              onChangeText={value => {
                setBio(value);
                setFeedback(null);
              }}
            />
          </TextField>

          <View className="gap-3 rounded-2xl bg-background px-4 py-4">
            <Text className="text-sm font-semibold text-foreground">{t('公开资料')}</Text>
            <View className={`${isTablet ? 'flex-row gap-2' : 'gap-2'}`}>
              {profileGenderOptions.map(option => (
                <View key={option.value} className={isTablet ? 'flex-1' : ''}>
                  <SelectButton
                    active={gender === option.value}
                    description={option.description}
                    label={option.label}
                    onPress={() => {
                      setGender(option.value);
                      setFeedback(null);
                    }}
                  />
                </View>
              ))}
            </View>

            <TextField isInvalid={birthdayError !== null}>
              <Label>{t('生日')}</Label>
              <Input
                autoCapitalize="none"
                placeholder="YYYY-MM-DD"
                value={birthday}
                onBlur={() => setBirthdayTouched(true)}
                onChangeText={value => {
                  setBirthday(value);
                  setFeedback(null);
                }}
              />
              <FieldError>{birthdayError ?? ''}</FieldError>
            </TextField>

            <TextField>
              <Label>{t('所在地区')}</Label>
              <Input
                placeholder={isEnglish ? 'e.g. Shanghai' : '例如 Shanghai'}
                value={location}
                onChangeText={value => {
                  setLocation(value);
                  setFeedback(null);
                }}
              />
            </TextField>

            <TextField>
              <Label>{t('公司 / 学校')}</Label>
              <Input
                placeholder={isEnglish ? 'e.g. Snipxn Lab' : '例如 Snipxn Lab'}
                value={company}
                onChangeText={value => {
                  setCompany(value);
                  setFeedback(null);
                }}
              />
            </TextField>

            <TextField>
              <Label>{t('GitHub 用户名')}</Label>
              <Input
                autoCapitalize="none"
                placeholder={isEnglish ? 'e.g. alice-dev' : '例如 alice-dev'}
                value={github}
                onChangeText={value => {
                  setGithub(value);
                  setFeedback(null);
                }}
              />
            </TextField>

            <TextField>
              <Label>{t('个人网站')}</Label>
              <Input
                autoCapitalize="none"
                placeholder="https://example.com"
                value={website}
                onChangeText={value => {
                  setWebsite(value);
                  setFeedback(null);
                }}
              />
            </TextField>

            <TextField>
              <Label>{t('技术栈')}</Label>
              <TextArea
                numberOfLines={4}
                placeholder={
                  isEnglish
                    ? 'e.g. Java, Spring Boot, Vue, PostgreSQL'
                    : '例如 Java, Spring Boot, Vue, PostgreSQL'
                }
                value={techStack}
                onChangeText={value => {
                  setTechStack(value);
                  setFeedback(null);
                }}
              />
            </TextField>
          </View>

          <Button isDisabled={savingProfile || uploadingAvatar} variant="primary" onPress={() => void handleSaveProfile()}>
            {renderButtonContent(savingProfile, t('保存中...'), t('保存资料'))}
          </Button>
        </View>
      </View>
    </SectionShell>
  );

  const renderSecuritySection = () => (
    <SectionShell title={t('账号安全')} description={isEnglish ? 'Change your password, review linked sign-in methods, and manage third-party access.' : '修改密码、查看绑定方式，并管理第三方登录入口。'}>
      <View className="gap-3 rounded-2xl bg-background px-4 py-4">
        <Text className="text-sm font-semibold text-foreground">{t('修改密码')}</Text>
        <TextField isInvalid={passwordError !== null}>
          <Label>{t('新密码')}</Label>
          <Input
            placeholder={t('请输入至少 6 位的新密码')}
            secureTextEntry
            textContentType="newPassword"
            value={password}
            onBlur={() => setPasswordTouched(true)}
            onChangeText={value => {
              setPassword(value);
              setFeedback(null);
            }}
          />
          <FieldError>{passwordError ?? ''}</FieldError>
        </TextField>
        <Button isDisabled={changingPassword} variant="outline" onPress={() => void handleChangePassword()}>
          {renderButtonContent(changingPassword, t('提交中...'), t('更新密码'))}
        </Button>
      </View>

      <Separator />

      <View className="gap-3">
        <Text className="text-sm font-semibold text-foreground">{t('第三方账号绑定')}</Text>
        {linkedAccountOptions.map(option => {
          const isBound = linkedAccountSet.has(option.identityType);
          const isProcessing = processingAccount === option.identityType;

          return (
            <View key={option.identityType} className="rounded-2xl bg-background px-4 py-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-foreground">{option.label}</Text>
                  <Text className="mt-1 text-xs text-foreground/60">
                    {option.identityType === 'PASSWORD'
                      ? t('默认密码登录方式，无法解除。')
                      : isBound
                        ? t('当前已绑定，可在此解除。')
                        : t('尚未绑定，点击绑定按钮前往授权。')}
                  </Text>
                </View>
                <View className={`rounded-full px-3 py-1 ${isBound ? 'bg-success/15' : 'bg-default-200'}`}>
                  <Text className={`text-xs font-medium ${isBound ? 'text-success' : 'text-foreground/60'}`}>
                    {isBound ? t('已绑定') : t('未绑定')}
                  </Text>
                </View>
              </View>
              {option.identityType === 'PASSWORD' ? null : isBound ? (
                <Button className="mt-4 self-start" isDisabled={isProcessing} variant="danger" onPress={() => void handleUnlinkAccount(option.identityType)}>
                  {renderButtonContent(isProcessing, t('解绑中...'), t('解除绑定'))}
                </Button>
              ) : (
                <Button className="mt-4 self-start" isDisabled={isProcessing} variant="outline" onPress={() => handleRequestBindAccount(option.identityType)}>
                  <Button.Label>{t('绑定')}</Button.Label>
                </Button>
              )}
            </View>
          );
        })}
      </View>
    </SectionShell>
  );

  const renderDevicesSection = () => (
    <SectionShell title={t('设备管理')} description={isEnglish ? 'Review signed-in devices and revoke other sessions when needed.' : '查看已登录设备，并按需撤销其他会话。'}>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-sm font-semibold text-foreground">{t('已登录设备')}</Text>
        <Button isDisabled={processingDeviceId === '__others__' || devices.length === 0} variant="outline" onPress={() => void handleRevokeOtherDevices()}>
          {renderButtonContent(processingDeviceId === '__others__', t('处理中...'), t('下线其他设备'))}
        </Button>
      </View>

      {devices.length === 0 ? (
        <View className="rounded-2xl bg-background px-4 py-5">
          <Text className="text-sm text-foreground/60">{t('暂无设备记录。')}</Text>
        </View>
      ) : (
        devices.map(device => {
          const isProcessing = processingDeviceId === device.deviceId;

          return (
            <View key={device.id || device.deviceId} className="rounded-2xl bg-background px-4 py-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-foreground">{device.deviceName ?? device.deviceId}</Text>
                  <Text className="mt-1 text-xs text-foreground/60">Device ID: {device.deviceId}</Text>
                  <Text className="mt-1 text-xs text-foreground/60">
                    {`${t('最近登录：')}${formatRelativeTime(device.lastLoginAt, language)}`}
                  </Text>
                  {device.lastLoginIp ? (
                    <Text className="mt-1 text-xs text-foreground/60">{`${t('登录 IP：')}${device.lastLoginIp}`}</Text>
                  ) : null}
                </View>
                <Button isDisabled={isProcessing} variant="danger" onPress={() => void handleRevokeDevice(device)}>
                  {renderButtonContent(isProcessing, t('移除中...'), t('移除'))}
                </Button>
              </View>
            </View>
          );
        })
      )}
    </SectionShell>
  );

  const renderPreferencesSection = () => (
    <SectionShell title={t('偏好设置')} description={isEnglish ? 'Theme changes apply immediately. Language and code font size are saved locally.' : '主题即时生效，语言和代码字号会持久化到本地。'}>
      <View className="gap-3 rounded-2xl bg-background px-4 py-4">
        <Text className="text-sm font-semibold text-foreground">{t('主题')}</Text>
        <Text className="text-xs text-foreground/60">
          {`${t('当前生效：')}${theme === 'dark' ? t('深色') : t('浅色')}${themePreference === 'system' ? t('（跟随系统）') : ''}`}
        </Text>
        <SelectButton active={themePreference === 'system'} description={t('根据系统外观自动切换')} label={t('跟随系统')} onPress={() => setThemePreference('system')} />
        <SelectButton active={themePreference === 'light'} description={t('始终使用亮色界面')} label={t('亮色')} onPress={() => setThemePreference('light')} />
        <SelectButton active={themePreference === 'dark'} description={t('始终使用暗色界面')} label={t('暗色')} onPress={() => setThemePreference('dark')} />
      </View>

      <Separator />

      <View className="gap-3 rounded-2xl bg-background px-4 py-4">
        <Text className="text-sm font-semibold text-foreground">{t('语言')}</Text>
        {languageOptions.map(option => (
          <SelectButton key={option.value} active={language === option.value} description={option.description} label={option.label} onPress={() => void handleSelectLanguage(option.value)} />
        ))}
      </View>

      <Separator />

      <View className="gap-3 rounded-2xl bg-background px-4 py-4">
        <Text className="text-sm font-semibold text-foreground">{t('代码字体大小')}</Text>
        {fontSizeOptions.map(option => (
          <SelectButton key={option.value} active={codeFontSize === option.value} description={`${option.description} · ${option.value}px`} label={option.label} onPress={() => void handleSelectCodeFontSize(option.value)} />
        ))}
      </View>

      {savingPreferences ? (
        <View className="flex-row items-center gap-2 rounded-2xl bg-primary/10 px-4 py-3">
          <Spinner color="default" size="sm" />
          <Text className="text-sm text-foreground">{t('正在保存偏好...')}</Text>
        </View>
      ) : null}
    </SectionShell>
  );

  const renderStorageSection = () => (
    <SectionShell title={t('存储空间')} description={t('展示当前账号配额与后端返回的使用明细。')}>
      <View className="rounded-2xl bg-background px-4 py-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-sm font-semibold text-foreground">{t('总览')}</Text>
          <Text className="text-xs text-foreground/60">{formatBytes(storageUsed)} / {formatBytes(storageLimit)}</Text>
        </View>
        <View className="mt-3 h-2 overflow-hidden rounded-full bg-default-200">
          <View className="h-full rounded-full bg-primary" style={{ width: `${storageProgress * 100}%` }} />
        </View>
        <Text className="mt-3 text-xs text-foreground/60">
          {isEnglish
            ? `Used ${(storageProgress * 100).toFixed(storageProgress >= 0.995 ? 0 : 1)}%`
            : `已使用 ${(storageProgress * 100).toFixed(storageProgress >= 0.995 ? 0 : 1)}%`}
        </Text>
      </View>

      {storageEntries.length === 0 ? (
        <View className="rounded-2xl bg-background px-4 py-5">
          <Text className="text-sm text-foreground/60">{t('后端暂未返回详细存储拆分。')}</Text>
        </View>
      ) : (
        storageEntries.map(entry => <InfoRow key={entry.key} label={entry.label} value={entry.value} />)
      )}
    </SectionShell>
  );

  const renderAboutSection = () => (
    <View className="gap-5">
      <SectionShell title={t('关于')} description={t('查看版本信息与更新状态。')}>
        <InfoRow label={t('应用版本')} value={currentVersionLabel} />
        {latestVersionLabel ? <InfoRow label={t('远程版本')} value={latestVersionLabel} /> : null}
        {latestVersionInfo?.releaseNotes ? (
          <View className="rounded-2xl bg-background px-4 py-4">
            <Text className="text-sm font-semibold text-foreground">{t('更新说明')}</Text>
            <Text className="mt-2 text-sm text-foreground/70">{latestVersionInfo.releaseNotes}</Text>
          </View>
        ) : null}
        <Button isDisabled={checkingUpdates} variant="outline" onPress={() => void handleCheckUpdates()}>
          {renderButtonContent(checkingUpdates, t('检查中...'), t('检查更新'))}
        </Button>
      </SectionShell>

      <SectionShell title={t('反馈')} description={t('当前通过系统分享面板发送反馈内容。')}>
        <TextField>
          <Label>{t('反馈内容')}</Label>
          <TextArea numberOfLines={5} placeholder={isEnglish ? 'Tell us what you want to improve or describe the issue you hit.' : '告诉我们你希望改进的地方，或描述你遇到的问题。'} value={feedbackText} onChangeText={setFeedbackText} />
        </TextField>
        <Button isDisabled={submittingFeedback} variant="outline" onPress={() => void handleSendFeedback()}>
          {renderButtonContent(submittingFeedback, t('准备中...'), t('发送反馈'))}
        </Button>
      </SectionShell>
    </View>
  );

  const renderLogoutSection = () => (
    <SectionShell title={t('退出登录')} description={t('退出后会清除本地凭证，并重置本地数据库。')}>
      <Text className="text-sm text-foreground/65">{t('这会同时清空离线缓存、同步元数据和当前登录态。重新进入应用后需要再次登录。')}</Text>
      <Button variant="danger" onPress={() => void logout()}>
        <Button.Label>{t('退出登录')}</Button.Label>
      </Button>
    </SectionShell>
  );

  const renderSectionContent = (section?: SettingsSectionKey) => {
    switch (section ?? activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'security':
        return renderSecuritySection();
      case 'devices':
        return renderDevicesSection();
      case 'preferences':
        return renderPreferencesSection();
      case 'storage':
        return renderStorageSection();
      case 'about':
        return renderAboutSection();
      case 'logout':
        return renderLogoutSection();
      default:
        return null;
    }
  };

  if (initializing) {
    return (
      <View className="flex-1" style={{ backgroundColor: palette.canvas }}>
        <SafeAreaView edges={safeAreaEdges} style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center gap-3 px-6">
            <Spinner color="default" size="lg" />
            <Text className={typography.body} style={{ color: palette.textSoft }}>
              {t('正在加载设置...')}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: palette.canvas }}>
      <SafeAreaView edges={safeAreaEdges} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {isTablet ? (
          <View className="flex-1 flex-row" style={{ backgroundColor: palette.canvas }}>
            <View
              className="w-[300px] border-r px-4 py-6"
              style={{ borderRightColor: palette.border, backgroundColor: palette.surface }}>
              <View
                className="rounded-[12px] border px-4 py-4"
                style={{
                  borderColor: withAlpha(palette.primary, 0.18),
                  backgroundColor: palette.surfaceAlt,
                }}>
                <View
                  className="mb-3 h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: palette.primarySoft }}>
                  <AppIcon color={palette.primary} name="settings" size={20} />
                </View>
                <Text className={typography.h2} style={{ color: palette.text }}>
                  {t('设置')}
                </Text>
                <Text className={`${typography.bodySmall} mt-2`} style={{ color: palette.textSoft }}>
                  {t('管理账号、安全、界面偏好与应用状态。')}
                </Text>
              </View>
              <View className="mt-6 gap-2">
                {(Object.keys(sectionTitles) as SettingsSectionKey[]).map(section => (
                  <MenuItem key={section} active={activeSection === section} destructive={section === 'logout'} label={sectionTitles[section]} onPress={() => setActiveSection(section)} />
                ))}
              </View>
              <Button className="mt-6" isDisabled={refreshing} variant="outline" onPress={() => void refreshData()}>
                {renderButtonContent(refreshing, t('刷新中...'), t('刷新设置'))}
              </Button>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View className="gap-5">
                {feedback ? (
                  <Animated.View entering={APP_FADE_IN} layout={APP_LAYOUT_TRANSITION}>
                    <Alert status={feedback.status}>
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>{feedback.title}</Alert.Title>
                        <Alert.Description>{feedback.description}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  </Animated.View>
                ) : null}
                <Animated.View
                  key={`tablet-section-${activeSection}`}
                  entering={APP_PANEL_ENTERING}
                  layout={APP_LAYOUT_TRANSITION}>
                  {renderSectionContent()}
                </Animated.View>
              </View>
            </ScrollView>
          </View>
        ) : mobileSection !== null ? (
          /* ── Mobile: section detail page ── */
          <Animated.View
            key={`mobile-section-${mobileSection}`}
            entering={APP_PANEL_ENTERING}
            layout={APP_LAYOUT_TRANSITION}
            style={{ flex: 1, minHeight: 0 }}>
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View className="gap-5">
                <View className="flex-row items-center gap-3">
                  <MotionPressable
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: palette.surfaceAlt }}
                    onPress={() => { setMobileSection(null); setFeedback(null); }}>
                    <AppIcon color={palette.text} name="arrow-left" size={20} />
                  </MotionPressable>
                  <Text className={typography.h3} style={{ color: palette.text }}>
                    {sectionTitles[mobileSection]}
                  </Text>
                </View>

                {feedback ? (
                  <Animated.View entering={APP_FADE_IN} layout={APP_LAYOUT_TRANSITION}>
                    <Alert status={feedback.status}>
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>{feedback.title}</Alert.Title>
                        <Alert.Description>{feedback.description}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  </Animated.View>
                ) : null}

                {renderSectionContent(mobileSection)}
              </View>
            </ScrollView>
          </Animated.View>
        ) : (
          /* ── Mobile: menu list page ── */
          <Animated.View
            key="mobile-settings-menu"
            entering={APP_FADE_IN}
            layout={APP_LAYOUT_TRANSITION}
            style={{ flex: 1, minHeight: 0 }}>
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View className="gap-5">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: palette.primarySoft }}>
                      <AppIcon color={palette.primary} name="settings" size={18} />
                    </View>
                    <Text className={typography.h3} style={{ color: palette.text }}>
                      {t('设置')}
                    </Text>
                  </View>
                  <Button isDisabled={refreshing} variant="outline" onPress={() => void refreshData()}>
                    {renderButtonContent(refreshing, t('刷新中...'), t('刷新'))}
                  </Button>
                </View>

                {/* user profile card */}
                {currentUser ? (
                  <View
                    className="flex-row items-center gap-4 rounded-[12px] border px-4 py-4"
                    style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
                    <Avatar alt={t('用户头像')} className="h-14 w-14" color="accent" size="md">
                      {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
                      <Avatar.Fallback>{avatarFallback}</Avatar.Fallback>
                    </Avatar>
                    <View className="min-w-0 flex-1">
                      <Text className="text-base font-semibold" style={{ color: palette.text }}>
                        {nickname || currentUser.email.split('@')[0]}
                      </Text>
                      <Text className="mt-1 text-sm" style={{ color: palette.textSoft }}>
                        {currentUser.email}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {feedback ? (
                  <Animated.View entering={APP_FADE_IN} layout={APP_LAYOUT_TRANSITION}>
                    <Alert status={feedback.status}>
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>{feedback.title}</Alert.Title>
                        <Alert.Description>{feedback.description}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  </Animated.View>
                ) : null}

                {/* menu items */}
                <View
                  className="rounded-[12px] border overflow-hidden"
                  style={{ borderColor: palette.border, backgroundColor: palette.surface }}>
                  {mobileMenuItems.map((item, index) => (
                    <MotionPressable
                      key={item.key}
                      className="flex-row items-center px-4 py-4"
                      style={[
                        index > 0 ? { borderTopWidth: 1, borderTopColor: palette.border } : undefined,
                      ]}
                      onPress={() => {
                        if (item.key === 'logout') {
                          void logout();
                        } else {
                          setMobileSection(item.key);
                          setFeedback(null);
                        }
                      }}>
                      <View
                        className="h-9 w-9 items-center justify-center rounded-xl"
                        style={{ backgroundColor: item.danger ? withAlpha(palette.danger, 0.12) : palette.surfaceAlt }}>
                        <AppIcon color={item.danger ? palette.danger : palette.textSoft} name={item.icon} size={18} />
                      </View>
                      <View className="ml-3 min-w-0 flex-1">
                        <Text
                          className="text-sm font-medium"
                          style={{ color: item.danger ? palette.danger : palette.text }}>
                          {sectionTitles[item.key]}
                        </Text>
                        {item.description ? (
                          <Text className="mt-0.5 text-xs" style={{ color: palette.textSoft }}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                      {!item.danger ? (
                        <AppIcon color={palette.textSoft} name="chevron-right" size={18} />
                      ) : null}
                    </MotionPressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
