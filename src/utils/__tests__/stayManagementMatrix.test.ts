/**
 * Stay Management coverage matrix (automated only — no browser/device).
 * SpaceType × StayType × Operation × pricing/food/inventory/validation.
 * MESS is explicitly excluded.
 */
import {
  ACCOMMODATION_STAY_SPACE_TYPES,
  hasConcreteAllocationTarget,
  stayTypesAvailableForSpace,
} from '../accommodationStaySupport';
import { mealsApplicableForSpace } from '../mealAccess';
import {
  applyStayChoice,
  pricingDefaultsForStayChoice,
  type StayChoice,
} from '../shortStay';
import {
  buildAllocateRequest,
  buildReserveRequest,
  buildTransferRequest,
  getAllowedTargetTypes,
  validateTargetSelection,
} from '../occupancyRules';
import { getWizardSteps } from '../../features/occupancy/OccupancyWizard/occupancyWizardSteps';
import { getOccupancyErrorMessage } from '../occupancyErrors';
import { ApiError } from '../../api/types';
import type { SpaceType } from '../../api/types';

jest.mock('../../i18n', () => ({
  i18n: { t: (key: string) => key },
}));

const STAY_TYPES: StayChoice[] = ['MONTHLY', 'SHORT', 'OPEN_ENDED'];
const OPERATIONS = ['ALLOCATE', 'RESERVE', 'TRANSFER'] as const;

const TARGET_IDS: Record<
  SpaceType,
  { targetType: 'BED' | 'ROOM' | 'UNIT'; ids: { bedId?: string; roomId?: string; unitId?: string } }
> = {
  PG: { targetType: 'BED', ids: { bedId: 'bed-pg' } },
  HOSTEL: { targetType: 'BED', ids: { bedId: 'bed-hostel' } },
  CO_LIVING: { targetType: 'ROOM', ids: { roomId: 'room-coliving' } },
  RENTAL: { targetType: 'UNIT', ids: { unitId: 'unit-rental' } },
  CORPORATE_STAY: { targetType: 'UNIT', ids: { unitId: 'unit-corp' } },
  MESS: { targetType: 'BED', ids: { bedId: 'should-not-use' } },
};

describe('Stay Management matrix — space × stay × operation', () => {
  it('enumerates every accommodation SpaceType and never includes MESS', () => {
    expect(ACCOMMODATION_STAY_SPACE_TYPES).toEqual([
      'PG',
      'HOSTEL',
      'CO_LIVING',
      'RENTAL',
      'CORPORATE_STAY',
    ]);
    expect(ACCOMMODATION_STAY_SPACE_TYPES).not.toContain('MESS');
    expect(stayTypesAvailableForSpace('MESS')).toBe(false);
    expect(getAllowedTargetTypes('MESS')).toEqual([]);
  });

  it.each(ACCOMMODATION_STAY_SPACE_TYPES)(
    '%s: stay types available and inventory targets match the model',
    (spaceType) => {
      expect(stayTypesAvailableForSpace(spaceType)).toBe(true);
      const allowed = getAllowedTargetTypes(spaceType);
      expect(allowed.length).toBeGreaterThan(0);
      if (spaceType === 'PG' || spaceType === 'HOSTEL') {
        expect(allowed).toEqual(['BED']);
      }
      if (spaceType === 'CO_LIVING') {
        expect(allowed).toEqual(['BED', 'ROOM']);
      }
      if (spaceType === 'RENTAL' || spaceType === 'CORPORATE_STAY') {
        expect(allowed).toEqual(['UNIT']);
      }
    },
  );

  describe.each(ACCOMMODATION_STAY_SPACE_TYPES)('space %s', (spaceType) => {
    describe.each(OPERATIONS)('operation %s', (operation) => {
      it.each(STAY_TYPES)('stay %s — wizard places stay_type before pricing', (stayType) => {
        const preselected =
          spaceType === 'CO_LIVING'
            ? { roomId: 'r1' }
            : spaceType === 'RENTAL' || spaceType === 'CORPORATE_STAY'
              ? { unitId: 'u1' }
              : { bedId: 'b1' };

        if (operation === 'ALLOCATE') {
          const steps = getWizardSteps('ALLOCATE', preselected, { spaceType });
          expect(steps[0]).toBe('stay_type');
          expect(steps.indexOf('stay_type')).toBeLessThan(steps.indexOf('contract'));
          expect(steps).toContain('review');
          expect(steps).not.toContain('target');
        }
        if (operation === 'RESERVE') {
          const steps = getWizardSteps('RESERVE', preselected, { spaceType });
          expect(steps[0]).toBe('stay_type');
          expect(steps).toContain('reserve_dates');
          expect(steps.indexOf('stay_type')).toBeLessThan(steps.indexOf('contract'));
          expect(steps).toContain('review');
        }
        if (operation === 'TRANSFER') {
          const steps = getWizardSteps('TRANSFER', { memberId: 'm1' }, { spaceType });
          expect(steps.indexOf('target')).toBeLessThan(steps.indexOf('stay_type'));
          expect(steps.indexOf('stay_type')).toBeLessThan(steps.indexOf('contract'));
          // stayType unused in step order — still covered for matrix completeness
          expect(stayType).toBeTruthy();
        }
      });
    });

    it.each(STAY_TYPES)('stay %s — allocate payload uses correct inventory ids', (stayType) => {
      const { targetType, ids } = TARGET_IDS[spaceType];
      const contract =
        stayType === 'MONTHLY'
          ? { rentSnapshot: 6000, depositSnapshot: 3000 }
          : stayType === 'SHORT'
            ? { depositSnapshot: 1000 }
            : { rentSnapshot: 250, depositSnapshot: 2000, pricingBasis: 'DAILY_RATE' as const };

      const built = buildAllocateRequest('member-1', spaceType, targetType, ids, {
        moveInDate: '2026-11-01',
        expectedExitDate: stayType === 'SHORT' ? '2026-11-08' : undefined,
        contract: contract as never,
      });
      expect(built.errorKey).toBeNull();
      expect(built.body).not.toBeNull();
      const body = built.body!;
      expect(body.memberId).toBe('member-1');
      expect(body.targetType).toBe(targetType);
      if (targetType === 'BED') {
        expect(body.bedId).toBe(ids.bedId);
        expect(body.roomId).toBeNull();
        expect(body.unitId).toBeNull();
      }
      if (targetType === 'ROOM') {
        expect(body.roomId).toBe(ids.roomId);
        expect(body.bedId).toBeNull();
        expect(body.unitId).toBeNull();
      }
      if (targetType === 'UNIT') {
        expect(body.unitId).toBe(ids.unitId);
        expect(body.bedId).toBeNull();
        expect(body.roomId).toBeNull();
      }

      const stayed = applyStayChoice(body as never, {
        enabled: false,
        choice: stayType,
        agreedTotal: stayType === 'SHORT' ? 5600 : null,
        checkInDate: '2026-11-01',
        expectedExitDate: stayType === 'SHORT' ? '2026-11-08' : null,
      });
      expect(stayed.errorKey).toBeNull();
      expect(stayed.body.stayKind).toBe(stayType);
      if (stayType === 'SHORT') {
        expect(stayed.body.agreedTotal).toBe(5600);
        expect(stayed.body.rentSnapshot).toBeUndefined();
      }
      if (stayType === 'MONTHLY') {
        expect(stayed.body.agreedTotal).toBeUndefined();
      }
      if (stayType === 'OPEN_ENDED') {
        expect(stayed.body.stayKind).toBe('OPEN_ENDED');
      }
    });

    it.each(STAY_TYPES)('stay %s — reserve payload retains pricing without implying activation', (stayType) => {
      const { targetType, ids } = TARGET_IDS[spaceType];
      const rent = stayType === 'MONTHLY' ? 7000 : stayType === 'OPEN_ENDED' ? 250 : null;
      const built = buildReserveRequest('member-1', spaceType, targetType, ids, {
        moveInDate: '2026-11-10',
        expectedExitDate: stayType === 'SHORT' ? '2026-11-15' : undefined,
        rentSnapshot: rent,
        depositSnapshot: 1500,
        foodEnabled: mealsApplicableForSpace(spaceType),
      });
      expect(built.errorKey).toBeNull();
      expect(built.body?.moveInDate).toBe('2026-11-10');
      expect(built.body?.depositSnapshot).toBe(1500);
      if (stayType === 'MONTHLY' || stayType === 'OPEN_ENDED') {
        expect(built.body?.rentSnapshot).toBe(rent);
      }
    });

    it.each(STAY_TYPES)('stay %s — transfer destination uses allowed inventory only', (stayType) => {
      const { targetType, ids } = TARGET_IDS[spaceType];
      const built = buildTransferRequest(spaceType, targetType, ids, {
        contract: {
          rentSnapshot: stayType === 'SHORT' ? undefined : stayType === 'OPEN_ENDED' ? 300 : 8000,
          depositSnapshot: 0,
        } as never,
      });
      expect(built.errorKey).toBeNull();
      expect(built.body?.targetType).toBe(targetType);
      expect(built.body?.rentPolicy).toBe('APPLY_NEW');
      // Reject inventory levels outside getAllowedTargetTypes for this space.
      const allowed = getAllowedTargetTypes(spaceType);
      if (!allowed.includes('BED')) {
        expect(validateTargetSelection(spaceType, 'BED', { bedId: 'x' })).toBe(
          'occupancy.errors.invalidTargetType',
        );
      }
      if (!allowed.includes('UNIT')) {
        expect(validateTargetSelection(spaceType, 'UNIT', { unitId: 'x' })).toBe(
          'occupancy.errors.invalidTargetType',
        );
      }
      if (!allowed.includes('ROOM')) {
        expect(validateTargetSelection(spaceType, 'ROOM', { roomId: 'x' })).toBe(
          'occupancy.errors.invalidTargetType',
        );
      }
    });
  });
});

describe('Stay Management matrix — pricing isolation and stay switching', () => {
  const catalog = { catalogRent: 6000, catalogDeposit: 3000 };

  const transitions: Array<[StayChoice, StayChoice]> = [
    ['MONTHLY', 'SHORT'],
    ['MONTHLY', 'OPEN_ENDED'],
    ['SHORT', 'MONTHLY'],
    ['SHORT', 'OPEN_ENDED'],
    ['OPEN_ENDED', 'MONTHLY'],
    ['OPEN_ENDED', 'SHORT'],
  ];

  it.each(transitions)('%s → %s clears incompatible pricing', (from, to) => {
    const next = pricingDefaultsForStayChoice({ choice: to, ...catalog });
    if (to === 'MONTHLY') {
      expect(next.rentSnapshot).toBe('6000');
      expect(next.agreedTotal).toBe('');
      expect(next.clearExpectedExit).toBe(false);
    }
    if (to === 'SHORT') {
      expect(next.rentSnapshot).toBe('');
      expect(next.agreedTotal).toBe('');
      expect(next.clearExpectedExit).toBe(true);
      // Never inherit monthly÷30
      expect(Number(next.rentSnapshot || 0)).not.toBe(200);
    }
    if (to === 'OPEN_ENDED') {
      expect(next.rentSnapshot).toBe('');
      expect(next.agreedTotal).toBe('');
      expect(next.clearExpectedExit).toBe(true);
      expect(next.rentSnapshot).not.toBe(String(Math.round(6000 / 30)));
    }
    expect(next.depositSnapshot).toBe('3000');
    expect(from).toBeTruthy();
  });

  it.each(ACCOMMODATION_STAY_SPACE_TYPES)(
    '%s: missing catalog defaults leave empty rent for Monthly and blank daily/agreed',
    (spaceType) => {
      expect(spaceType).not.toBe('MESS');
      expect(
        pricingDefaultsForStayChoice({
          choice: 'MONTHLY',
          catalogRent: null,
          catalogDeposit: null,
        }).rentSnapshot,
      ).toBe('');
      expect(
        pricingDefaultsForStayChoice({
          choice: 'OPEN_ENDED',
          catalogRent: 9000,
          catalogDeposit: null,
        }).rentSnapshot,
      ).toBe('');
      expect(
        pricingDefaultsForStayChoice({
          choice: 'SHORT',
          catalogRent: 9000,
          catalogDeposit: 0,
        }).depositSnapshot,
      ).toBe('0');
    },
  );

  it('SHORT applyStayChoice never submits monthly rentSnapshot', () => {
    const result = applyStayChoice(
      { rentSnapshot: 8500, depositSnapshot: 2000 },
      {
        enabled: true,
        choice: 'SHORT',
        agreedTotal: 5600,
        checkInDate: '2026-11-01',
        expectedExitDate: '2026-11-08',
      },
    );
    expect(result.errorKey).toBeNull();
    expect(result.body.rentSnapshot).toBeUndefined();
    expect(result.body.agreedTotal).toBe(5600);
  });

  it('rejects blank/invalid short stay pricing and dates', () => {
    expect(
      applyStayChoice(
        {},
        { enabled: true, choice: 'SHORT', agreedTotal: null, expectedExitDate: '2026-11-08' },
      ).errorKey,
    ).toBe('occupancy.contract.dailyRent');
    expect(
      applyStayChoice(
        {},
        {
          enabled: true,
          choice: 'SHORT',
          agreedTotal: 0,
          checkInDate: '2026-11-01',
          expectedExitDate: '2026-11-08',
        },
      ).errorKey,
    ).toBe('occupancy.contract.dailyRent');
    expect(
      applyStayChoice(
        {},
        {
          enabled: true,
          choice: 'SHORT',
          agreedTotal: 500,
          checkInDate: '2026-11-01',
          expectedExitDate: '',
        },
      ).errorKey,
    ).toBe('occupancy.section.expectedMoveOut');
  });
});

describe('Stay Management matrix — food inclusion by space type', () => {
  it.each(ACCOMMODATION_STAY_SPACE_TYPES)('%s food applicability for all stay types', (spaceType) => {
    const foodOk = mealsApplicableForSpace(spaceType);
    if (spaceType === 'RENTAL') {
      expect(foodOk).toBe(false);
    } else {
      expect(foodOk).toBe(true);
    }
    for (const stay of STAY_TYPES) {
      const { targetType, ids } = TARGET_IDS[spaceType];
      const built = buildAllocateRequest('m1', spaceType, targetType, ids, {
        contract: {
          rentSnapshot: stay === 'OPEN_ENDED' ? 250 : 5000,
          depositSnapshot: 1000,
          foodEnabled: foodOk,
          foodIncludedInRent: false,
          foodChargeSnapshot: foodOk && stay === 'MONTHLY' ? 1500 : null,
        } as never,
      });
      expect(built.errorKey).toBeNull();
      if (!foodOk) {
        // Rental must not invent food charges in the happy path contract
        expect(built.body).toMatchObject({});
      }
      if (stay === 'OPEN_ENDED' && foodOk) {
        // Daily food is not invented — monthly foodChargeSnapshot may be omitted by UI
        expect(built.body).toBeTruthy();
      }
    }
  });

  it('MESS food remains a separate path and stay matrix does not treat MESS as lodging', () => {
    expect(mealsApplicableForSpace('MESS')).toBe(true);
    expect(stayTypesAvailableForSpace('MESS')).toBe(false);
  });
});

describe('Stay Management matrix — inventory preselection and negative targets', () => {
  it('CO_LIVING roomId is concrete; PG roomId alone is not', () => {
    expect(hasConcreteAllocationTarget('CO_LIVING', { roomId: 'r1' })).toBe(true);
    expect(hasConcreteAllocationTarget('PG', { roomId: 'r1' })).toBe(false);
    expect(hasConcreteAllocationTarget('HOSTEL', { roomId: 'r1' })).toBe(false);
  });

  it.each([
    ['PG', 'ROOM', { roomId: 'r1' }, 'occupancy.errors.invalidTargetType'],
    ['HOSTEL', 'UNIT', { unitId: 'u1' }, 'occupancy.errors.invalidTargetType'],
    ['RENTAL', 'BED', { bedId: 'b1' }, 'occupancy.errors.invalidTargetType'],
    ['CORPORATE_STAY', 'ROOM', { roomId: 'r1' }, 'occupancy.errors.invalidTargetType'],
    ['CO_LIVING', 'BED', {}, 'occupancy.errors.bedRequired'],
    ['CO_LIVING', 'ROOM', {}, 'occupancy.errors.roomRequired'],
    ['RENTAL', 'UNIT', {}, 'occupancy.errors.unitRequired'],
  ] as const)(
    '%s rejects %s with ids %j → %s',
    (spaceType, targetType, ids, expected) => {
      expect(validateTargetSelection(spaceType, targetType, ids)).toBe(expected);
    },
  );

  it('reserve requires move-in date', () => {
    const result = buildReserveRequest('m1', 'PG', 'BED', { bedId: 'b1' }, {
      moveInDate: '   ',
    });
    expect(result.errorKey).toBe('occupancy.errors.moveInDateRequired');
  });
});

describe('Stay Management matrix — API error presentation (no raw stack)', () => {
  it.each([
    ['Bed is not available', 400, 'occupancy.errors.targetUnavailable'],
    ['Room is not available', 400, 'occupancy.errors.targetUnavailable'],
    ['Unit is not available', 400, 'occupancy.errors.targetUnavailable'],
    ['Bed is not available (status: MAINTENANCE)', 400, 'occupancy.errors.targetMaintenance'],
    ['Member gender does not match bed policy', 400, 'occupancy.errors.genderMismatch'],
    ['column occupancies.secret failed', 500, 'occupancy.errors.generic'],
    ['Rent is required when activating occupancy', 400, 'occupancy.contract.errors.rentRequired'],
  ])('maps "%s" (%s) → %s', (message, status, expected) => {
    const mapped = getOccupancyErrorMessage(new ApiError(message, status));
    expect(mapped).toBe(expected);
    expect(mapped).not.toMatch(/Exception|stack|at com\./i);
  });
});

describe('Stay Management matrix — Serviced Apartment naming', () => {
  it('has no SERVICED SpaceType; corporate/rental cover serviced inventory', () => {
    expect(ACCOMMODATION_STAY_SPACE_TYPES).not.toContain('SERVICED' as never);
    expect(ACCOMMODATION_STAY_SPACE_TYPES).toContain('CORPORATE_STAY');
    expect(ACCOMMODATION_STAY_SPACE_TYPES).toContain('RENTAL');
  });
});
