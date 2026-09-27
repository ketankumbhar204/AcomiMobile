import { getWizardSteps, getWizardTitleKey } from '../occupancyWizardSteps';

describe('occupancyWizardSteps', () => {
  it('keeps allocate member step when a bed is already chosen', () => {
    expect(
      getWizardSteps('ALLOCATE', { bedId: 'bed-1' }),
    ).toEqual(['member', 'contract', 'review']);
  });

  it('uses Move In today title for allocate', () => {
    expect(getWizardTitleKey('ALLOCATE')).toBe('occupancyWizard.title.allocate');
  });
});
