import { isMarkedTestLead } from '../adminTestLead';

describe('isMarkedTestLead', () => {
  it('labels only records the API marks as test leads', () => {
    expect(isMarkedTestLead(true)).toBe(true);
    expect(isMarkedTestLead(false)).toBe(false);
    expect(isMarkedTestLead(undefined)).toBe(false);
    expect(isMarkedTestLead(null)).toBe(false);
  });
});
