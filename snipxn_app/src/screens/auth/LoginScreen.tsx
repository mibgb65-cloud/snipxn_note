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
import { AppLogo } from '../../components/common/AppLogo';
import { buildGitHubAuthorizeUrl } from '../../config/oauth';
import { translateLiteral, useI18n } from '../../i18n';
import { signInWithGoogle } from '../../services/googleSignIn';
import { useDeviceType } from '../../hooks';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores';
import { useAppTheme } from '../../theme';

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
  const loginWithGoogleMobile = useAuthStore(state => state.loginWithGoogleMobile);
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
    <View className="flex-1 bg-background">
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
                style={isTablet ? { maxWidth: isTabletLandscape ? 540 : 400 } : undefined}>
                <View className="items-center gap-3">
                  <AppLogo size={64} />
                  <Text className={`${typography.h2} text-center text-foreground`}>
                    {t('登录 Snipxn')}
                  </Text>
                  <Text className={`${typography.body} text-center text-foreground/70`}>
                    {t('登录你的账号，同步代码片段与笔记。')}
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
                      onPress={() => navigation.navigate('ForgotPassword')}>
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
                    <Text className={`${typography.bodySmall} text-foreground/55`}>
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
                      <AppIcon color={palette.text} name="github" size={18} />
                      <Button.Label>GitHub</Button.Label>
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onPress={() => {
                        (async () => {
                          try {
                            const googleUser = await signInWithGoogle();
                            await loginWithGoogleMobile(googleUser);
                          } catch (error) {
                            setFeedback({
                              status: 'danger',
                              title: t('登录失败'),
                              description: getErrorMessage(error, t('Google 登录失败，请稍后重试。')),
                            });
                          }
                        })();
                      }}>
                      <AppIcon color={palette.text} name="google" size={18} />
                      <Button.Label>Google</Button.Label>
                    </Button>
                  </View>
                </View>

                <View className="mt-8 flex-row items-center justify-center gap-1">
                  <Text className={`${typography.body} text-foreground/70`}>
                    {t('没有账号？')}
                  </Text>
                  <LinkButton size="md" onPress={() => navigation.navigate('Register')}>
                    {t('注册')}
                  </LinkButton>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
