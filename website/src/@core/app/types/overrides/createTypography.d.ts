import * as createTypography from '@mui/material/styles/createTypography';

declare module '@mui/material/styles/createTypography' {
  //   export interface FontStyle
  //     extends Required<{
  //       textTransform: TextTransform;
  //       fontSize: string | number; // added string
  //     }> {}
  //   export interface FontStyleOptions extends Partial<FontStyle> {
  //     fontSize?: string | number; // added string
  //   }

  export type Variant = 'customInput';

  export interface TypographyOptions extends Partial<Record<Variant, TypographyStyleOptions>> {
    customInput?: TypographyStyleOptions;
  }

  export interface Typography extends Record<Variant, TypographyStyle>, FontStyle, TypographyUtils {
    customInput: TypographyStyle;
  }
}
