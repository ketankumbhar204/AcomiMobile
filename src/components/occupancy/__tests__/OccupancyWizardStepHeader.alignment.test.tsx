import { StyleSheet } from 'react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock('lucide-react-native', () => ({
  Check: 'Check',
}));

jest.mock('../SelectedInventorySummaryCard', () => ({
  SelectedInventorySummaryCard: () => null,
}));

import { occupancyWizardStepHeaderStyles } from '../OccupancyWizardStepHeader';

/**
 * Regression: step header must not add its own horizontal gutter.
 * Page container owns left/right padding so stepper and body align.
 */
describe('OccupancyWizardStepHeader alignment', () => {
  it('does not apply horizontal padding on the header wrap', () => {
    const flat = StyleSheet.flatten(occupancyWizardStepHeaderStyles.wrap);
    expect(flat.paddingHorizontal).toBe(0);
  });
});
