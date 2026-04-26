import { NativeModules, Platform } from 'react-native';

export interface NoteImageShareOptions {
  title: string;
  summary: string;
  language?: string;
  updatedAt?: string;
  shareUrl?: string;
  brand?: string;
  footer?: string;
  qrLabel?: string;
  chooserTitle?: string;
}

interface NoteImageShareNativeModule {
  shareNoteImage(options: NoteImageShareOptions): Promise<boolean>;
}

const nativeModule = NativeModules.NoteImageShare as NoteImageShareNativeModule | undefined;

export async function shareNoteImage(options: NoteImageShareOptions): Promise<void> {
  if (Platform.OS !== 'android' || !nativeModule?.shareNoteImage) {
    throw new Error('当前设备暂不支持图片分享。');
  }

  await nativeModule.shareNoteImage(options);
}
