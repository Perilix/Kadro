import { useColorScheme } from 'react-native';
import { radius, themes, type ThemeColors } from '@kadro/tokens';

export function useTheme(): ThemeColors {
  return useColorScheme() === 'dark' ? themes.dark : themes.light;
}

export { radius };
export type { ThemeColors };
