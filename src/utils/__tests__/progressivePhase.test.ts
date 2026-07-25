import {
  resolveProgressivePhase,
  type ProgressivePhaseInput,
} from '../progressivePhase';

describe('resolveProgressivePhase', () => {
  const base: ProgressivePhaseInput = {
    enabled: true,
    prerequisiteMet: true,
    sectionReviewed: false,
  };

  it('returns ready when disabled', () => {
    expect(resolveProgressivePhase({ ...base, enabled: false })).toBe('ready');
  });

  it('returns start when prerequisite not met', () => {
    expect(resolveProgressivePhase({ ...base, prerequisiteMet: false })).toBe('start');
  });

  it('returns continue when prerequisite met and section not reviewed', () => {
    expect(resolveProgressivePhase(base)).toBe('continue');
  });

  it('returns ready when section reviewed', () => {
    expect(resolveProgressivePhase({ ...base, sectionReviewed: true })).toBe('ready');
  });
});
