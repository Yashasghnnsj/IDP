import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import { Colors, DarkColors } from '../theme';

type ThemeState = {
  isDark: boolean;
  colors: typeof Colors;
  toggleTheme: () => void;
  setDark: (value: boolean) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  colors: Colors,
  toggleTheme: () =>
    set((state) => ({
      isDark: !state.isDark,
      colors: !state.isDark ? (DarkColors as any) : Colors,
    })),
  setDark: (value: boolean) =>
    set({
      isDark: value,
      colors: value ? (DarkColors as any) : Colors,
    }),
}));
