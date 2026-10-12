import {
  addPersonNoun,
  countImportableCandidates,
  destinationForAddPersonChoice,
  shouldOfferImportChoice,
} from '../addPersonChoice';

describe('add person choice', () => {
  it('uses customer wording for mess and member wording otherwise', () => {
    expect(addPersonNoun('MESS')).toBe('customer');
    expect(addPersonNoun('PG')).toBe('member');
    expect(addPersonNoun(undefined)).toBe('member');
  });

  it('opens the existing new form or the existing import flow', () => {
    expect(destinationForAddPersonChoice('MESS', 'new')).toEqual({
      type: 'form',
      pickerMode: 'new',
    });
    expect(destinationForAddPersonChoice('MESS', 'import')).toEqual({
      type: 'form',
      pickerMode: 'search',
    });
    expect(destinationForAddPersonChoice('PG', 'new')).toEqual({
      type: 'form',
      pickerMode: 'new',
    });
    expect(destinationForAddPersonChoice('HOSTEL', 'import')).toEqual({
      type: 'import-screen',
    });
  });
});

describe('import choice eligibility', () => {
  const eligible = { availableForMoveIn: true, alreadyInTargetSpace: false };
  const alreadyHere = { availableForMoveIn: true, alreadyInTargetSpace: true };
  const unavailable = { availableForMoveIn: false, alreadyInTargetSpace: false };

  it('opens the form when there is nobody to import', () => {
    expect(shouldOfferImportChoice(countImportableCandidates([]))).toBe(false);
    expect(shouldOfferImportChoice(countImportableCandidates([unavailable]))).toBe(false);
    expect(shouldOfferImportChoice(countImportableCandidates([alreadyHere, alreadyHere]))).toBe(
      false,
    );
  });

  it('opens the choice when at least one person can be imported', () => {
    expect(shouldOfferImportChoice(countImportableCandidates([eligible]))).toBe(true);
    expect(
      shouldOfferImportChoice(
        countImportableCandidates([alreadyHere, eligible, eligible, unavailable]),
      ),
    ).toBe(true);
    expect(countImportableCandidates([alreadyHere, eligible, eligible])).toBe(2);
  });
});
