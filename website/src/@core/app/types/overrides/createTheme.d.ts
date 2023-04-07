// eslint-disable-next-line
import * as createTheme from '@mui/material/styles';
import { customShadows } from 'themes/shadows';

declare module '@mui/material/styles' {
  export interface ThemeOptions {
    customShadows?: customShadows;
  }
  interface Theme {
    customShadows: customShadows;
  }
}
