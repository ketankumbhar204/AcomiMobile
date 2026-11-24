import {
  addPersonNoun,
  countImportableCandidates,
  destinationForAddPersonChoice,
  offersUseExistingChoice,
  shouldOfferImportChoice,
} from '../addPersonChoice';

describe('add person choice', () => {
  it('uses customer wording for mess and member wording otherwise', () => {
    expect(addPersonNoun('MESS')).toBe('customer');
    expect(addPersonNoun('PG')).toBe('member');
    expect(addPersonNoun(undefined)).toBe('member');
  });

  it('opens the new form, or the Mess use-existing search', () => {
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
  });

  it('never routes lodging to the import screen; only Mess offers use-existing', () => {
    for (const spaceType of ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL', 'CORPORATE_STAY', undefined]) {
      expect(offersUseExistingChoice(spaceType)).toBe(false);
      expect(destinationForAddPersonChoice(spaceType, 'import')).toEqual({
        type: 'form',
        pickerMode: 'new',
      });
    }
    expect(offersUseExistingChoice('MESS')).toBe(true);
  });
});

describe('import choice eligibility', () => {
  const eligible = { availableForMoveIn: true, alreadyInTargetSpace: false };
  const alreadyHere = { availableForMoveIn: true, alreadyInTargetSpace: true };
  const unavailable = { availableForMoveIn: false, alreadyInTargetSpace: false };

  it('counts people in other spaces and skips people already in this space', () => {
    expect(shouldOfferImportChoice(countImportableCandidates([]))).toBe(false);
    expect(shouldOfferImportChoice(countImportableCandidates([unavailable]))).toBe(true);
    expect(shouldOfferImportChoice(countImportableCandidates([alreadyHere, alreadyHere]))).toBe(
      false,
    );
    expect(countImportableCandidates([alreadyHere, eligible, unavailable])).toBe(2);
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
