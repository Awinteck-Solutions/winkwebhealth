import { createTheme } from '@mantine/core';

const modalDropdownZIndex = 10000;

export const winkTheme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '700',
  },
  colors: {
    brand: [
      '#ecfdf5',
      '#d1fae5',
      '#a7f3d0',
      '#6ee7b7',
      '#34d399',
      '#10b981',
      '#0d9488',
      '#0f766e',
      '#115e59',
      '#134e4a',
    ],
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  other: {
    sidebarBg: '#0F172A',
    pageBg: '#0B1120',
    cardBg: '#111827',
    cardBorder: '#1E293B',
    textMuted: '#94A3B8',
    upGreen: '#10B981',
    downRed: '#EF4444',
  },
  components: {
    Select: {
      defaultProps: {
        comboboxProps: {
          withinPortal: true,
          zIndex: modalDropdownZIndex,
        },
      },
    },
    MultiSelect: {
      defaultProps: {
        comboboxProps: {
          withinPortal: true,
          zIndex: modalDropdownZIndex,
        },
      },
    },
  },
});
