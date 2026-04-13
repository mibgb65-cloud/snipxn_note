import { GoogleSignin } from '@react-native-google-signin/google-signin';

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

export function configureGoogleSignIn(): void {
  GoogleSignin.configure({});
}

export async function signInWithGoogle(): Promise<GoogleUserInfo> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  const user = result.data?.user;

  if (!user?.id) {
    throw new Error('无法获取 Google 用户信息，请重试。');
  }

  return {
    googleId: user.id,
    email: user.email,
    name: user.name ?? null,
    avatar: user.photo ?? null,
  };
}
