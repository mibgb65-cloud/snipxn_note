import { GoogleSignin } from '@react-native-google-signin/google-signin';

const DEV_CLIENT_ID =
  '849351808154-ege9pte7j31pnvv8hnhgj95s3fgkto93.apps.googleusercontent.com';
const RELEASE_CLIENT_ID =
  '841313932086-bigskud2ci5od18hfbetrqrr34vq4u1h.apps.googleusercontent.com';

export function configureGoogleSignIn(): void {
  GoogleSignin.configure({
    webClientId: __DEV__ ? DEV_CLIENT_ID : RELEASE_CLIENT_ID,
    offlineAccess: true,
  });
}

export async function signInWithGoogle(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const userInfo = await GoogleSignin.signIn();
  const serverAuthCode = userInfo.data?.serverAuthCode;

  if (!serverAuthCode) {
    throw new Error('无法获取 Google 授权码，请重试。');
  }

  return serverAuthCode;
}
