import { extendTheme } from '@mui/joy';

const defaultTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#e9f0f6',
          100: '#c8dae9',
          200: '#a3c1da',
          300: '#7ea8cb',
          400: '#6295bf',
          500: '#4682b4',
          600: '#244a67',
          700: '#0f1b28',
          800: '#08111c',
          900: '#02070c',
        }
      }
    },
  }
});

export { defaultTheme };