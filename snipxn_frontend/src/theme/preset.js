import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

const SnipxnPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f7fafc',
          100: '#eef4f7',
          200: '#dbe7eb',
          300: '#c2d2d8',
          400: '#97adb7',
          500: '#6c8590',
          600: '#516871',
          700: '#3a4c54',
          800: '#24343a',
          900: '#152127',
          950: '#0b1317',
        },
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.900}',
          focusColor: '{primary.950}',
        },
      },
      dark: {
        surface: {
          0: '#070f17',
          50: '#0b1420',
          100: '#111b29',
          200: '#182536',
          300: '#233347',
          400: '#394d62',
          500: '#587089',
          600: '#7f97af',
          700: '#a8bfd1',
          800: '#d0dfe9',
          900: '#e9f3f8',
          950: '#f7fbfd',
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.0}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400} 20%, transparent)',
          focusBackground: 'color-mix(in srgb, {primary.400} 28%, transparent)',
          color: '{surface.900}',
          focusColor: '{surface.950}',
        },
      },
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.400}',
      offset: '2px',
      shadow: '0 0 0 0 transparent',
    },
  },
});

export default SnipxnPreset;
