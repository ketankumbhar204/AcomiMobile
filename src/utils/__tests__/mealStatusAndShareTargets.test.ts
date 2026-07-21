import type { MySpaceResponse } from '../../api/types';
import {
  isMealShareCompatibleSpace,
  listOtherShareTargetSpaces,
} from '../shareMenuToSpaces';
import { resolveMealStatusKind } from '../mealStatusTheme';

function space(
  partial: Partial<MySpaceResponse> & Pick<MySpaceResponse, 'spaceId' | 'spaceName' | 'spaceType'>,
): MySpaceResponse {
  return {
    membershipRole: 'OWNER',
    isDefault: false,
    joinedAt: '2026-01-01',
    ...partial,
  };
}

describe('resolveMealStatusKind', () => {
  it('uses menu publication only; poll never replaces Shared', () => {
    expect(resolveMealStatusKind(null, null)).toBe('empty');
    expect(
      resolveMealStatusKind(
        { status: 'DRAFT', options: [{ isAvailable: true }] } as never,
        { status: 'OPEN' },
      ),
    ).toBe('draft');
    expect(
      resolveMealStatusKind(
        { status: 'PUBLISHED', options: [{ isAvailable: true }] } as never,
        null,
      ),
    ).toBe('shared');
    expect(
      resolveMealStatusKind(
        { status: 'PUBLISHED', options: [{ isAvailable: true }] } as never,
        { status: 'OPEN' },
      ),
    ).toBe('shared');
    expect(
      resolveMealStatusKind(
        { status: 'PUBLISHED', options: [{ isAvailable: true }] } as never,
        { status: 'CLOSED' },
      ),
    ).toBe('shared');
    expect(
      resolveMealStatusKind(
        { status: 'MODIFIED', options: [{ isAvailable: true }] } as never,
        null,
      ),
    ).toBe('needs_reshare');
  });
});

describe('shareMenuToSpaces helpers', () => {
  it('hides rental and spaces without meal manage permission', () => {
    expect(
      isMealShareCompatibleSpace(
        space({ spaceId: '1', spaceName: 'Office', spaceType: 'RENTAL' }),
      ),
    ).toBe(false);
    expect(
      isMealShareCompatibleSpace(
        space({
          spaceId: '2',
          spaceName: 'Mess',
          spaceType: 'MESS',
          membershipRole: 'OWNER',
        }),
      ),
    ).toBe(true);
    expect(
      isMealShareCompatibleSpace(
        space({
          spaceId: '3',
          spaceName: 'Tenant only',
          spaceType: 'PG',
          membershipRole: 'TENANT',
        }),
      ),
    ).toBe(false);
  });

  it('lists other compatible spaces excluding current', () => {
    const spaces = [
      space({ spaceId: 'a', spaceName: 'Mess A', spaceType: 'MESS' }),
      space({ spaceId: 'b', spaceName: 'Mess B', spaceType: 'MESS' }),
      space({ spaceId: 'c', spaceName: 'Rental', spaceType: 'RENTAL' }),
    ];
    expect(listOtherShareTargetSpaces(spaces, 'a').map(s => s.spaceId)).toEqual(['b']);
  });
});
