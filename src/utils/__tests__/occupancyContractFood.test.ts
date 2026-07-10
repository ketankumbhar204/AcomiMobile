import {
  buildContractSnapshotPayload,
  emptyContractTermsFormValues,
  isFoodBundledWithRent,
  resolveSubmitFoodChargeSnapshot,
  validateContractTerms,
} from '../occupancyContract';
import { resolveSpaceFoodPolicy } from '../fetchSpaceFoodPolicy';

describe('occupancyContract food toggle', () => {
  const bundledPolicy = resolveSpaceFoodPolicy({ type: 'PG' });

  it('defaults include-food toggle on', () => {
    expect(emptyContractTermsFormValues().foodEnabled).toBe(true);
  });

  it('bundled PG with toggle on sends foodIncludedInRent without food charge', () => {
    const values = {
      ...emptyContractTermsFormValues({ defaultRent: 7000 }, bundledPolicy),
      rentSnapshot: '7000',
      foodEnabled: true,
    };

    expect(validateContractTerms(values, { rentRequired: true, foodPolicy: bundledPolicy })).toBeNull();
    expect(isFoodBundledWithRent(values, bundledPolicy)).toBe(true);
    expect(
      buildContractSnapshotPayload(values, { foodPolicy: bundledPolicy }),
    ).toEqual({
      rentSnapshot: 7000,
      depositSnapshot: 0,
      foodEnabled: true,
      foodIncludedInRent: true,
      foodChargeSnapshot: null,
    });
  });

  it('toggle off does not mark food as bundled', () => {
    const values = {
      ...emptyContractTermsFormValues(undefined, bundledPolicy),
      rentSnapshot: '7000',
      foodEnabled: false,
    };

    expect(
      buildContractSnapshotPayload(values, { foodPolicy: bundledPolicy }),
    ).toMatchObject({
      foodEnabled: false,
      foodIncludedInRent: false,
      foodChargeSnapshot: null,
    });
  });

  it('uses space default silently when separate food policy exists', () => {
    const separatePolicy = { foodIncludedInRent: false, defaultFoodCharge: 2500 };
    const values = {
      ...emptyContractTermsFormValues(undefined, separatePolicy),
      rentSnapshot: '7000',
      foodEnabled: true,
      foodChargeSnapshot: '',
    };

    expect(isFoodBundledWithRent(values, separatePolicy)).toBe(false);
    expect(resolveSubmitFoodChargeSnapshot(values, separatePolicy)).toBe(2500);
    expect(
      buildContractSnapshotPayload(values, { foodPolicy: separatePolicy }),
    ).toMatchObject({
      foodEnabled: true,
      foodIncludedInRent: false,
      foodChargeSnapshot: 2500,
    });
  });
});
