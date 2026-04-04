import { Image } from 'react-native';

const prefetched = new Set<string>();

export function prefetchImages(urls: (string | null | undefined)[]): void {
  for (const url of urls) {
    if (url && !prefetched.has(url)) {
      prefetched.add(url);
      Image.prefetch(url).catch(() => {
        prefetched.delete(url);
      });
    }
  }
}
