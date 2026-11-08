export { colors, pastels } from './colors';
export { spacing, pageContentGutter } from './spacing';
export { typography, fontSize, fontWeight, fontFamily, lineHeight } from './typography';
export { radius } from './radius';
export { shadows } from './shadows';
export { stackHeaderOptions, tabHeaderOptions, tabBarOptions } from './navigation';

import { colors } from './colors';
import { spacing, pageContentGutter } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  pageContentGutter,
  radius,
  shadows,
  typography,
} as const;
