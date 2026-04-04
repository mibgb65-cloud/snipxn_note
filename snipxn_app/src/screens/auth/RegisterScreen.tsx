import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  Button,
  FieldError,
  Input,
  InputOTP,
  Label,
  LinkButton,
  Spinner,
  TextField,
  REGEXP_ONLY_DIGITS,
} from 'heroui-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as authApi from '../../api/auth';
import { translateLiteral, useI18n } from '../../i18n';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores';
import { useAppTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type RegisterStep = 'form' | 'verify';

type FeedbackState = {
  status: 'accent' | 'warning' | 'danger';
  title: string;
  description: string;
} | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;
const OTP_LENGTH = 6;
const OTP_SLOT_CLASS_NAME = 'h-12 w-10 rounded-2xl';

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

export function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore(state => state.register);
  const login = useAuthStore(state => state.login);
  const { isTablet, typography } = useAppTheme();
  const { isEnglish, t } = useI18n();

  const otpRef = useRef<any>(null);

  const [step, setStep] = useState<RegisterStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

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

  const confirmPasswordError = useMemo(() => {
    if (confirmPassword.trim().length === 0) {
      return t('请再次输入密码');
    }

    if (confirmPassword !== password) {
      return t('两次输入的密码不一致');
    }

    return null;
  }, [confirmPassword, password, t]);

  const codeError = useMemo(() => {
    if (code.length === 0) {
      return t('请输入 6 位验证码');
    }

    if (code.length !== OTP_LENGTH) {
      return t('验证码长度应为 6 位');
    }

    return null;
  }, [code, t]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendSeconds(current => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [resendSeconds]);

  useEffect(() => {
    if (step !== 'verify') {
      return;
    }

    const timer = setTimeout(() => {
      otpRef.current?.focus?.();
    }, 60);

    return () => {
      clearTimeout(timer);
    };
  }, [step]);

  const sendRegisterCode = async () => {
    await authApi.sendCode({
      email: trimmedEmail,
      scene: 'REGISTER',
    });
  };

  const handleNextStep = async () => {
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setFeedback(null);

    if (emailError || passwordError || confirmPasswordError) {
      return;
    }

    setSendingCode(true);

    try {
      await sendRegisterCode();
      setStep('verify');
      setCode('');
      setCodeTouched(false);
      setResendSeconds(RESEND_SECONDS);
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('验证码发送失败'),
        description: getErrorMessage(error, t('操作失败，请稍后重试。')),
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendSeconds > 0 || sendingCode) {
      return;
    }

    setFeedback(null);
    setSendingCode(true);

    try {
      await sendRegisterCode();
      setResendSeconds(RESEND_SECONDS);
      setCode('');
      otpRef.current?.clear?.();
      otpRef.current?.focus?.();
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('重新发送失败'),
        description: getErrorMessage(error, t('操作失败，请稍后重试。')),
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async () => {
    setCodeTouched(true);
    setFeedback(null);

    if (codeError) {
      return;
    }

    setSubmitting(true);

    try {
      await register(trimmedEmail, code, password);
      await login(trimmedEmail, password);
    } catch (error) {
      setFeedback({
        status: 'danger',
        title: t('注册失败'),
        description: getErrorMessage(error, t('操作失败，请稍后重试。')),
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
            <View className={`w-full ${isTablet ? 'mx-auto max-w-[400px]' : ''}`}>
              <View className="items-center gap-2">
                <Text className={`${typography.h2} text-center text-foreground`}>{t('注册 Snipxn')}</Text>
                <Text className={`${typography.body} text-center text-foreground/70`}>
                  {step === 'form'
                    ? t('创建一个账号，开始同步你的代码片段笔记。')
                    : t('输入邮箱验证码，完成账号创建。')}
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

                {step === 'form' ? (
                  <>
                    <TextField isRequired isInvalid={emailTouched && emailError !== null}>
                      <Label>{t('邮箱')}</Label>
                      <Input
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        placeholder={t('请输入邮箱')}
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

                    <TextField isRequired isInvalid={passwordTouched && passwordError !== null}>
                      <Label>{t('密码')}</Label>
                      <Input
                        autoCapitalize="none"
                        autoComplete="password-new"
                        placeholder={t('请输入密码')}
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

                    <TextField
                      isRequired
                      isInvalid={confirmPasswordTouched && confirmPasswordError !== null}>
                      <Label>{t('确认密码')}</Label>
                      <Input
                        autoCapitalize="none"
                        autoComplete="password-new"
                        placeholder={t('请再次输入密码')}
                        secureTextEntry
                        textContentType="newPassword"
                        value={confirmPassword}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        onChangeText={value => {
                          setConfirmPassword(value);
                          setFeedback(null);
                        }}
                        onSubmitEditing={() => {
                          void handleNextStep();
                        }}
                      />
                      <FieldError>{confirmPasswordError ?? ''}</FieldError>
                    </TextField>

                    <Button
                      isDisabled={sendingCode}
                      size="lg"
                      variant="primary"
                      onPress={() => {
                        void handleNextStep();
                      }}>
                      {sendingCode ? (
                        <>
                          <Spinner color="default" size="sm" />
                          <Button.Label>{t('发送中...')}</Button.Label>
                        </>
                      ) : (
                        t('下一步')
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Alert status="accent">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>{t('验证码已发送')}</Alert.Title>
                        <Alert.Description>
                          {isEnglish ? `A verification code was sent to ${trimmedEmail}` : `验证码已发送至 ${trimmedEmail}`}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert>

                    <View className="gap-3">
                      <Label>{t('邮箱验证码')}</Label>
                      <InputOTP
                        ref={otpRef}
                        className="self-center"
                        isInvalid={codeTouched && codeError !== null}
                        inputMode="numeric"
                        maxLength={OTP_LENGTH}
                        pattern={REGEXP_ONLY_DIGITS}
                        value={code}
                        onChange={value => {
                          setCode(value);
                          setFeedback(null);
                        }}
                        onComplete={value => {
                          setCode(value);
                        }}>
                        <InputOTP.Group className="flex-row gap-2">
                          <InputOTP.Slot index={0} className={OTP_SLOT_CLASS_NAME} />
                          <InputOTP.Slot index={1} className={OTP_SLOT_CLASS_NAME} />
                          <InputOTP.Slot index={2} className={OTP_SLOT_CLASS_NAME} />
                        </InputOTP.Group>
                        <InputOTP.Separator className="mx-0 w-1.5" />
                        <InputOTP.Group className="flex-row gap-2">
                          <InputOTP.Slot index={3} className={OTP_SLOT_CLASS_NAME} />
                          <InputOTP.Slot index={4} className={OTP_SLOT_CLASS_NAME} />
                          <InputOTP.Slot index={5} className={OTP_SLOT_CLASS_NAME} />
                        </InputOTP.Group>
                      </InputOTP>
                      {codeTouched && codeError ? (
                        <FieldError isInvalid>{codeError}</FieldError>
                      ) : null}
                    </View>

                    <View className="flex-row items-center justify-between">
                      <LinkButton
                        isDisabled={resendSeconds > 0 || sendingCode}
                        size="sm"
                        onPress={() => {
                          void handleResendCode();
                        }}>
                        {t('重新发送')}
                      </LinkButton>
                      <Text className={`${typography.bodySmall} text-foreground/55`}>
                        {resendSeconds > 0
                          ? isEnglish
                            ? `Resend in ${resendSeconds}s`
                            : `${resendSeconds} 秒后可重发`
                          : t('现在可以重新发送')}
                      </Text>
                    </View>

                    <Button
                      isDisabled={submitting}
                      size="lg"
                      variant="primary"
                      onPress={() => {
                        void handleRegister();
                      }}>
                      {submitting ? (
                        <>
                          <Spinner color="default" size="sm" />
                          <Button.Label>{t('注册中...')}</Button.Label>
                        </>
                      ) : (
                        t('注册')
                      )}
                    </Button>

                    <View className="items-center">
                      <LinkButton
                        size="sm"
                        onPress={() => {
                          setStep('form');
                          setCodeTouched(false);
                          setFeedback(null);
                        }}>
                        {t('返回上一步修改信息')}
                      </LinkButton>
                    </View>
                  </>
                )}
              </View>

              <View className="mt-8 flex-row items-center justify-center gap-1">
                <Text className={`${typography.body} text-foreground/70`}>
                  {t('已有账号？')}
                </Text>
                <LinkButton size="md" onPress={() => navigation.goBack()}>
                  {t('返回登录')}
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
