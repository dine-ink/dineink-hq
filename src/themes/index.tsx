import { ReactNode, useMemo } from 'react';

import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import useConfig from 'hooks/useConfig';
import CustomShadows from './custom-shadows';
import componentsOverride from './overrides';
import { buildPalette } from './palette';
import Typography from './typography';

export default function ThemeCustomization({ children }: { children: ReactNode }) {
  const { state } = useConfig();

  const themeTypography = useMemo(() => Typography(state.fontFamily), [state.fontFamily]);

  const palette = useMemo(() => buildPalette(state.presetColor), [state.presetColor]);

  const themeOptions = useMemo(
    () => ({
      breakpoints: {
        values: {
          xs: 0,
          sm: 768,
          md: 1024,
          lg: 1266,
          xl: 1440
        }
      },

      direction: 'ltr',

      mixins: {
        toolbar: {
          minHeight: 60,
          paddingTop: 8,
          paddingBottom: 8
        }
      },

      palette: palette.light,

      typography: themeTypography,

      customShadows: CustomShadows(palette.light, 'light')
    }),
    [themeTypography, palette]
  );

  const themes = createTheme(themeOptions);
  themes.components = componentsOverride(themes);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider disableTransitionOnChange theme={themes} modeStorageKey="theme-mode" defaultMode="light">
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
