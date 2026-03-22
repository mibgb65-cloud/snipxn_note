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
          50: '#fbfefd',
          100: '#f4faf8',
          200: '#deece8',
          300: '#c3d8d2',
          400: '#98b2aa',
          500: '#6e8780',
          600: '#536a64',
          700: '#3a504b',
          800: '#243833',
          900: '#152622',
          950: '#0a1513',
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
          0: '#081311',
          50: '#0d1a18',
          100: '#112320',
          200: '#16302b',
          300: '#21423b',
          400: '#366159',
          500: '#4d8479',
          600: '#73b0a4',
          700: '#9bd0c6',
          800: '#c7e7e0',
          900: '#e7f7f3',
          950: '#f6fffd',
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
