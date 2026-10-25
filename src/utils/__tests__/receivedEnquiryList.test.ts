import { dedupeById, enquiryInitials, listingMatchesQuery } from '../receivedEnquiryList';

describe('receivedEnquiryList', () => {
  it('builds initials from a customer name and ignores a blank name', () => {
    expect(enquiryInitials('Rahul Sharma')).toBe('RS');
    expect(enquiryInitials('  ananya  ')).toBe('A');
    expect(enquiryInitials('  ')).toBe('');
    expect(enquiryInitials(null)).toBe('');
  });

  it('drops duplicate enquiry cards', () => {
    const rows = dedupeById([
      { enquiryId: 'a', spaceName: 'One' },
      { enquiryId: 'a', spaceName: 'Again' },
      { enquiryId: 'b', spaceName: 'Two' },
    ]);
    expect(rows.map(row => row.enquiryId)).toEqual(['a', 'b']);
  });

  it('matches a listing name without treating an empty query as a filter', () => {
    expect(listingMatchesQuery('Stanza Living', '')).toBe(true);
    expect(listingMatchesQuery('Stanza Living', 'stanza')).toBe(true);
    expect(listingMatchesQuery('Stanza Living', 'hostel')).toBe(false);
  });
});
