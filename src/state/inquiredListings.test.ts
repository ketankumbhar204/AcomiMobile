import {
  getInquiredIds,
  listingAlreadyInquired,
  loadInquiredListings,
  markInquired,
  resetInquiredListings,
} from './inquiredListings';

describe('inquired listings', () => {
  beforeEach(() => {
    resetInquiredListings();
  });

  it('does not mark a listing the current user has not enquired about', () => {
    expect(listingAlreadyInquired(['space-a'], 'space-b')).toBe(false);
    expect(getInquiredIds().has('space-b')).toBe(false);
  });

  it('marks only the current user listing ids returned by the backend', async () => {
    let calls = 0;
    const first = loadInquiredListings('user-1', async () => {
      calls += 1;
      return ['space-a'];
    });
    await loadInquiredListings('user-1', async () => {
      calls += 1;
      return ['space-other'];
    });
    await first;

    expect(calls).toBe(1);
    expect(listingAlreadyInquired(getInquiredIds(), 'space-a')).toBe(true);
    expect(listingAlreadyInquired(getInquiredIds(), 'space-b')).toBe(false);
  });

  it('drops a listing once the backend says the enquiry expired', async () => {
    await loadInquiredListings('user-1', async () => ['space-a']);
    markInquired('space-a');
    await loadInquiredListings('user-1', async () => []);
    expect(getInquiredIds().has('space-a')).toBe(false);
  });

  it('keeps a just-submitted enquiry without another fetch', async () => {
    await loadInquiredListings('user-1', async () => []);
    markInquired('space-new');
    expect(getInquiredIds().has('space-new')).toBe(true);
  });

  it('clears enquiry state when the session changes', async () => {
    await loadInquiredListings('user-1', async () => ['space-a']);
    resetInquiredListings();
    let seenUser = '';
    await loadInquiredListings('user-2', async () => {
      seenUser = 'user-2';
      return [];
    });
    expect(seenUser).toBe('user-2');
    expect(getInquiredIds().has('space-a')).toBe(false);
  });
});
