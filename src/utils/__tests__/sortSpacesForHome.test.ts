import type { MySpaceResponse } from '../../api/types';
import { sortSpacesForHome } from '../sortSpacesForHome';

function space(
  partial: Partial<MySpaceResponse> & Pick<MySpaceResponse, 'spaceId' | 'spaceName'>,
): MySpaceResponse {
  return {
    spaceType: 'PG',
    membershipRole: 'OWNER',
    isDefault: false,
    joinedAt: '2026-01-01',
    ...partial,
  };
}

describe('sortSpacesForHome', () => {
  it('puts the default space first', () => {
    const sorted = sortSpacesForHome(
      [
        space({ spaceId: 'a', spaceName: 'Alpha' }),
        space({ spaceId: 'b', spaceName: 'Beta', isDefault: true }),
        space({ spaceId: 'c', spaceName: 'Charlie' }),
      ],
      () => 0,
    );

    expect(sorted.map(row => row.spaceId)).toEqual(['b', 'a', 'c']);
  });

  it('keeps attention after the default space', () => {
    const sorted = sortSpacesForHome(
      [
        space({ spaceId: 'quiet', spaceName: 'Quiet' }),
        space({ spaceId: 'busy', spaceName: 'Busy' }),
        space({ spaceId: 'home', spaceName: 'Home', isDefault: true }),
      ],
      row => (row.spaceId === 'busy' ? 3 : 0),
    );

    expect(sorted.map(row => row.spaceId)).toEqual(['home', 'busy', 'quiet']);
  });
});
