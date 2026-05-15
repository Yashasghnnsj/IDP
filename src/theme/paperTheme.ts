import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Colors } from './colors';

export const PaperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    secondary: Colors.accent,
    background: Colors.background,
    surface: Colors.surface,
    error: Colors.danger,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: Colors.text,
    onSurface: Colors.text,
  },
  roundness: 22,
  fonts: configureFonts({
    config: {
      fontFamily: 'Inter-Regular',
    },
  }),
};