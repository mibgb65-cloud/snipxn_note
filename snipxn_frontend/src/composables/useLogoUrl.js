import { computed } from 'vue';
import { useTheme } from './useTheme';
import logoDark from '../assets/logo-dark.svg';
import logoLight from '../assets/logo-light.svg';

export function useLogoUrl() {
  const { isDarkTheme } = useTheme();
  const logoUrl = computed(() => isDarkTheme.value ? logoDark : logoLight);
  return { logoUrl };
}
