import { colors, pastels } from '../../theme';
import type { ButtonTint } from '../ui/Button';

/** Shared pastel tints for occupancy stay-action buttons. */
export const occupancyActionTint = {
  transfer: pastels.blue,
  vacate: { bg: colors.errorTint, border: '#FECACA', fg: colors.danger },
  viewHistory: pastels.mint,
  allocate: pastels.green,
  reserve: pastels.purple,
  moveIn: pastels.green,
  cancel: { bg: colors.errorTint, border: '#FECACA', fg: colors.danger },
} as const satisfies Record<string, ButtonTint>;
