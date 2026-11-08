import { buildExtendStayRequest } from '../extendStay';

describe('buildExtendStayRequest', () => {
  it('sends the owner-entered extension amount and omits a blank amount', () => {
    expect(
      buildExtendStayRequest({
        expectedExitDate: '2026-11-10',
        additionalAmount: '1600',
        rentSnapshot: '',
        rentEffectiveMonth: '',
        idempotencyKey: 'key-1',
      }),
    ).toEqual({
      expectedExitDate: '2026-11-10',
      additionalAmount: 1600,
      idempotencyKey: 'key-1',
    });

    const free = buildExtendStayRequest({
      expectedExitDate: '2026-11-10',
      additionalAmount: '',
      rentSnapshot: '',
      rentEffectiveMonth: '',
      idempotencyKey: 'key-2',
    });
    expect(free.additionalAmount).toBeUndefined();
    expect(free.rentSnapshot).toBeUndefined();
  });

  it('requires the new rent and its effective month together', () => {
    expect(
      buildExtendStayRequest({
        expectedExitDate: '2026-11-30',
        additionalAmount: '0',
        rentSnapshot: '11000',
        rentEffectiveMonth: '2026-11',
        idempotencyKey: 'key-3',
      }).rentEffectiveMonth,
    ).toBe('2026-11-01');

    expect(() =>
      buildExtendStayRequest({
        expectedExitDate: '2026-11-30',
        additionalAmount: '',
        rentSnapshot: '11000',
        rentEffectiveMonth: '',
        idempotencyKey: 'key-4',
      }),
    ).toThrow('RENT_FIELDS');
  });
});
