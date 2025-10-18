import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'task-manager-ui-color-mode';

const getInitialMode = (): PaletteMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  const prefersDark = window
    .matchMedia?.('(prefers-color-scheme: dark)')
    ?.matches;
  return prefersDark ? 'dark' : 'light';
};

interface ColorModeContextValue {
  mode: PaletteMode;
  toggleMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleMode: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useColorMode = () => useContext(ColorModeContext);

const getDesignTokens = (mode: PaletteMode) => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      background: {
        default: isLight ? '#f4f4f5' : '#07070b',
        paper: isLight ? '#ffffff' : '#111118',
      },
      primary: {
        main: isLight ? '#111118' : '#f5f5f6',
        contrastText: isLight ? '#f5f5f6' : '#07070b',
      },
      secondary: {
        main: isLight ? '#4b5563' : '#9ca3af',
      },
      divider: isLight ? '#e5e7eb' : 'rgba(148, 163, 184, 0.24)',
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily:
        "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 600,
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      body2: {
        color: isLight ? '#4b5563' : '#9ca3af',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? '#f4f4f5' : '#07070b',
            color: isLight ? '#111118' : '#f5f5f6',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none',
            backgroundColor: isLight ? '#ffffff' : '#111118',
            border: isLight
              ? '1px solid rgba(17, 17, 24, 0.06)'
              : '1px solid rgba(148, 163, 184, 0.18)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            paddingInline: 20,
            boxShadow: 'none',
          },
          contained: {
            backgroundColor: isLight ? '#111118' : '#f5f5f6',
            color: isLight ? '#f5f5f6' : '#07070b',
            '&:hover': {
              backgroundColor: isLight ? '#1f2937' : '#e4e4e7',
              boxShadow: 'none',
            },
          },
          outlined: {
            borderColor: isLight
              ? 'rgba(17, 17, 24, 0.16)'
              : 'rgba(229, 231, 235, 0.24)',
            color: isLight ? '#111118' : '#f5f5f6',
            '&:hover': {
              borderColor: isLight
                ? 'rgba(17, 17, 24, 0.32)'
                : 'rgba(229, 231, 235, 0.36)',
              backgroundColor: isLight ? 'rgba(17, 17, 24, 0.04)' : 'rgba(148, 163, 184, 0.12)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 500,
            letterSpacing: '0.02em',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};

const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const theme = useMemo(() => getDesignTokens(mode), [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default AppThemeProvider;
