import { resolveSpaceFoodPolicy } from '../fetchSpaceFoodPolicy';
import {
  buildContractSnapshotPayload,
  emptyContractTermsFormValues,
  validateContractTerms,
} from '../occupancyContract';

describe('resolveSpaceFoodPolicy', () => {
  it('treats explicit foodIncludedInRent as bundled', () => {
    expect(
      resolveSpaceFoodPolicy({
        type: 'PG',
        foodIncludedInRent: true,
        defaultFoodCharge: 2500,
      }),
    ).toEqual({
      foodIncludedInRent: true,
      defaultFoodCharge: null,
    });
  });

  it('treats PG without separate food charge as bundled in rent', () => {
    expect(
      resolveSpaceFoodPolicy({
        type: 'PG',
        foodIncludedInRent: false,
      }),
    ).toEqual({
      foodIncludedInRent: true,
      defaultFoodCharge: null,
    });
  });

  it('keeps separate food charge when PG has defaultFoodCharge', () => {
    expect(
      resolveSpaceFoodPolicy({
        type: 'PG',
        defaultFoodCharge: 2500,
      }),
    ).toEqual({
      foodIncludedInRent: false,
      defaultFoodCharge: 2500,
    });
  });
});

describe('move-in contract validation with bundled PG food', () => {
  const bundledPgPolicy = resolveSpaceFoodPolicy({ type: 'PG' });

  it('defaults food toggle on', () => {
    expect(emptyContractTermsFormValues().foodEnabled).toBe(true);
  });

  it('does not require a separate food charge', () => {
    const values = emptyContractTermsFormValues(
      { defaultRent: 7000, defaultDeposit: 3000 },
      bundledPgPolicy,
    );

    expect(
      validateContractTerms(values, {
        rentRequired: true,
        foodPolicy: bundledPgPolicy,
      }),
    ).toBeNull();
  });

  it('submits food as included in rent when toggle is on', () => {
    const values = emptyContractTermsFormValues(
      { defaultRent: 7000, defaultDeposit: 3000 },
      bundledPgPolicy,
    );

    expect(buildContractSnapshotPayload(values, { foodPolicy: bundledPgPolicy })).toEqual(
      expect.objectContaining({
        foodEnabled: true,
        foodIncludedInRent: true,
        foodChargeSnapshot: null,
        rentSnapshot: 7000,
      }),
    );
  });
});
