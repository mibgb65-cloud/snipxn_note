import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  Button,
  FieldError,
  Input,
  Label,
  LinkButton,
  Separator,
  Spinner,
  TextField,
} from 'heroui-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '../../components/common/AppIcon';
import { buildGitHubAuthorizeUrl } from '../../config/oauth';
import { translateLiteral, useI18n } from '../../i18n';
import { signInWithGoogle } from '../../services/googleSignIn';
import { useDeviceType } from '../../hooks';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores';
import { useAppTheme, withAlpha } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

type FeedbackState = {
  status: 'accent' | 'warning' | 'danger';
  title: string;
  description: string;
} | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore(state => state.login);
  const loginWithOAuth = useAuthStore(state => state.loginWithOAuth);
  const { isTablet, palette, typography } = useAppTheme();
  const { isTabletLandscape } = useDeviceType();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const trimmedEmail = email.trim();
  const emailError = useMemo(() => {
    if (trimmedEmail.length === 0) {
      return t('请输入邮箱地址');
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      return t('请输入有效的邮箱地址');
    }

    return null;
  }, [t, trimmedEmail]);

  const passwordError = useMemo(() => {
    if (password.trim().length === 0) {
      return t('请输入密码');
    }

    return null;
  }, [password, t]);

  const showEmailError = emailTouched && emailError !== null;
  const showPasswordError = passwordTouched && passwordError !== null;

  const handleSubmit = async () => {
    setEmailTouched(true);
    setPasswordTouched(true);
    setFeedback(null);

    if (emailError || passwordError) {
      return;
    }

    setSubmitting(true);

    try {
      await login(trimmedEmail, password);
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('登录失败'),
        description: getErrorMessage(error, t('登录失败，请稍后重试。')),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: palette.canvas }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'android' ? -100 : 0}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View className="flex-1 justify-center px-6 py-10">
              <View
                className={`w-full ${isTablet ? 'mx-auto' : ''}`}
                style={isTablet ? { maxWidth: isTabletLandscape ? 760 : 460 } : undefined}>
                <View style={isTabletLandscape ? { flexDirection: 'row', alignItems: 'stretch', gap: 32 } : undefined}>
                  {isTabletLandscape ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 24 }}>
                      <View
                        className="h-16 w-16 items-center justify-center rounded-2xl border"
                        style={{
                          borderColor: palette.border,
                          backgroundColor: palette.panelStrong,
                        }}>
                        <AppIcon color={palette.primary} name="notes" size={32} />
                      </View>
                      <Text className={typography.h1} style={{ color: palette.text, fontWeight: '800' }}>
                        Snipxn
                      </Text>
                      <Text
                        className={`${typography.body} text-center`}
                        style={{ color: palette.textSoft, maxWidth: 240 }}>
                        {t('面向代码片段、技术笔记与社区协作的移动工作台')}
                      </Text>
                    </View>
                  ) : null}

                  <View style={isTabletLandscape ? { flex: 1 } : undefined}>
                    <View
                      className="overflow-hidden rounded-[12px] border px-6 py-6"
                      style={{
                        borderColor: withAlpha(palette.primary, 0.18),
                        backgroundColor: palette.surface,
                        shadowColor: palette.shadow,
                        shadowOpacity: 0.14,
                        shadowRadius: 18,
                        shadowOffset: { width: 0, height: 12 },
                        elevation: 10,
                      }}>
                      {!isTabletLandscape ? (
                        <View className="items-center gap-3">
                          <View
                            className="h-12 w-12 items-center justify-center rounded-[12px] border"
                            style={{
                              borderColor: palette.border,
                              backgroundColor: palette.panelStrong,
                            }}>
                            <AppIcon color={palette.primary} name="notes" size={24} />
                          </View>
                          <View className="items-center gap-2">
                            <Text className={typography.h2} style={{ color: palette.text, fontWeight: '800' }}>
                              Snipxn
                            </Text>
                            <Text
                              className={`${typography.bodySmall} text-center`}
                              style={{ color: palette.textSoft }}>
                              {t('面向代码片段、技术笔记与社区协作的移动工作台')}
                            </Text>
                          </View>
                        </View>
                      ) : null}

                      <View className={isTabletLandscape ? 'gap-5' : 'mt-8 gap-5'}>
                        {feedback ? (
                          <Alert status={feedback.status}>
                            <Alert.Indicator />
                            <Alert.Content>
                              <Alert.Title>{feedback.title}</Alert.Title>
                              <Alert.Description>{feedback.description}</Alert.Description>
                            </Alert.Content>
                          </Alert>
                        ) : null}

                        <TextField isRequired isInvalid={showEmailError}>
                          <Label>{t('邮箱')}</Label>
                          <Input
                            autoCapitalize="none"
                            autoComplete="email"
                            keyboardType="email-address"
                            placeholder={t('请输入邮箱')}
                            returnKeyType="next"
                            textContentType="emailAddress"
                            value={email}
                            onBlur={() => setEmailTouched(true)}
                            onChangeText={value => {
                              setEmail(value);
                              setFeedback(null);
                            }}
                          />
                          <FieldError>{emailError ?? ''}</FieldError>
                        </TextField>

                        <TextField isRequired isInvalid={showPasswordError}>
                          <Label>{t('密码')}</Label>
                          <Input
                            autoCapitalize="none"
                            autoComplete="password"
                            placeholder={t('请输入密码')}
                            returnKeyType="done"
                            secureTextEntry
                            textContentType="password"
                            value={password}
                            onBlur={() => setPasswordTouched(true)}
                            onChangeText={value => {
                              setPassword(value);
                              setFeedback(null);
                            }}
                            onSubmitEditing={() => {
                              void handleSubmit();
                            }}
                          />
                          <FieldError>{passwordError ?? ''}</FieldError>
                        </TextField>

                        <View className="items-end">
                          <LinkButton
                            size="sm"
                            onPress={() => {
                              setFeedback({
                                status: 'warning',
                                title: t('功能未接入'),
                                description: t('忘记密码流程将在后续步骤中接入。'),
                              });
                            }}>
                            {t('忘记密码？')}
                          </LinkButton>
                        </View>

                        <Button
                          isDisabled={submitting}
                          size="lg"
                          variant="primary"
                          onPress={() => {
                            void handleSubmit();
                          }}>
                          {submitting ? (
                            <>
                              <Spinner color="default" size="sm" />
                              <Button.Label>{t('登录中...')}</Button.Label>
                            </>
                          ) : (
                            t('登录')
                          )}
                        </Button>

                        <View className="flex-row items-center gap-3">
                          <Separator className="flex-1" />
                          <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
                            {t('其他登录方式')}
                          </Text>
                          <Separator className="flex-1" />
                        </View>

                        <View className="flex-row gap-3">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onPress={() => {
                              Linking.openURL(buildGitHubAuthorizeUrl('login')).catch(() => {
                                setFeedback({
                                  status: 'danger',
                                  title: t('无法打开浏览器'),
                                  description: t('请检查系统设置后重试。'),
                                });
                              });
                            }}>
                            GitHub
                          </Button>
                          <Button
                            className="flex-1"
                            variant="outline"
                            onPress={() => {
                              (async () => {
                                try {
                                  const serverAuthCode = await signInWithGoogle();
                                  await loginWithOAuth('google', serverAuthCode);
                                } catch (error) {
                                  setFeedback({
                                    status: 'danger',
                                    title: t('登录失败'),
                                    description: getErrorMessage(error, t('Google 登录失败，请稍后重试。')),
                                  });
                                }
                              })();
                            }}>
                            Google
                          </Button>
                        </View>
                      </View>
                    </View>

                    <View className="mt-8 flex-row items-center justify-center gap-1">
                      <Text className={typography.body} style={{ color: palette.textSoft }}>
                        {t('没有账号？')}
                      </Text>
                      <LinkButton size="md" onPress={() => navigation.navigate('Register')}>
                        {t('注册')}
                      </LinkButton>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
