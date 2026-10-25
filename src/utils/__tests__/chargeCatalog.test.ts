import {
  buildManualCharge,
  chargeTypeMatchesQuery,
  findCatalogChargeType,
  isChargeablePaymentMember,
  listCatalogChargeTypes,
  memberMatchesPaymentSearch,
  parsePositiveAmount,
} from '../chargeCatalog';

describe('chargeCatalog', () => {
  it('maps maintenance, deposit, electricity, meals, penalty, and other', () => {
    expect(
      buildManualCharge({
        category: 'MAINTENANCE',
        typeId: 'REPAIR',
        typeLabel: 'Repair',
        customLabel: '',
        description: 'Bathroom tap replacement',
      }),
    ).toEqual({
      paymentType: 'MAINTENANCE',
      paymentCategory: 'EXTRA',
      title: 'Repair',
      description: 'Bathroom tap replacement',
    });

    expect(
      buildManualCharge({
        category: 'DEPOSIT',
        typeId: 'SECURITY_DEPOSIT',
        typeLabel: 'Security deposit',
        customLabel: '',
        description: '',
      })?.paymentCategory,
    ).toBe('SECURITY');

    expect(
      buildManualCharge({
        category: 'UTILITY',
        typeId: 'ELECTRICITY',
        typeLabel: 'Electricity',
        customLabel: '',
        description: '',
      }),
    ).toMatchObject({ paymentType: 'UTILITY', paymentCategory: 'ELECTRICITY' });

    expect(
      buildManualCharge({
        category: 'MEALS',
        typeId: 'EXTRA_MEALS',
        typeLabel: 'Extra meals',
        customLabel: '',
        description: '',
      }),
    ).toMatchObject({ paymentType: 'MEAL', paymentCategory: 'EXTRA' });

    expect(
      buildManualCharge({
        category: 'PENALTY',
        typeId: 'LATE_FEE',
        typeLabel: 'Late payment fee',
        customLabel: '',
        description: '',
      }),
    ).toMatchObject({ paymentType: 'PENALTY', paymentCategory: 'EXTRA' });

    expect(
      buildManualCharge({
        category: 'OTHER',
        typeId: 'OTHER',
        typeLabel: 'Other',
        customLabel: 'Gate remote',
        description: '',
      })?.title,
    ).toBe('Gate remote');
  });

  it('rejects a missing category, type, custom label, and non-positive amount', () => {
    expect(
      buildManualCharge({
        category: '',
        typeId: 'REPAIR',
        typeLabel: 'Repair',
        customLabel: '',
        description: '',
      }),
    ).toBeNull();
    expect(
      buildManualCharge({
        category: 'MAINTENANCE',
        typeId: '',
        typeLabel: 'Repair',
        customLabel: '',
        description: '',
      }),
    ).toBeNull();
    expect(
      buildManualCharge({
        category: 'OTHER',
        typeId: 'OTHER',
        typeLabel: 'Other',
        customLabel: '   ',
        description: '',
      }),
    ).toBeNull();
    expect(parsePositiveAmount('')).toBeNull();
    expect(parsePositiveAmount('0')).toBeNull();
    expect(parsePositiveAmount('-10')).toBeNull();
    expect(parsePositiveAmount('1,500')).toBe(1500);
  });

  it('searches chargeable members by name, mobile, and member id', () => {
    const member = {
      memberId: '8556255',
      fullName: 'PGA Member',
      mobileNumber: '9855625544',
      role: 'TENANT',
      status: 'ACTIVE',
    };
    expect(isChargeablePaymentMember(member)).toBe(true);
    expect(isChargeablePaymentMember({ ...member, role: 'OWNER' })).toBe(false);
    expect(isChargeablePaymentMember({ ...member, role: 'MANAGER' })).toBe(false);
    expect(isChargeablePaymentMember({ ...member, status: 'VACATED' })).toBe(false);
    expect(memberMatchesPaymentSearch(member, 'pga')).toBe(true);
    expect(memberMatchesPaymentSearch(member, '98556')).toBe(true);
    expect(memberMatchesPaymentSearch(member, '8556255')).toBe(true);
    expect(memberMatchesPaymentSearch(member, 'rahul')).toBe(false);
    expect(memberMatchesPaymentSearch(member, '   ')).toBe(true);
  });

  it('searches every charge type and derives its category', () => {
    const types = listCatalogChargeTypes();
    expect(types.some(type => type.id === 'ELECTRICITY' && type.category === 'UTILITY')).toBe(true);
    expect(types.some(type => type.id === 'LAUNDRY' && type.category === 'SERVICE')).toBe(true);
    expect(findCatalogChargeType('ELECTRICITY')?.category).toBe('UTILITY');
    expect(findCatalogChargeType('LAUNDRY')?.category).toBe('SERVICE');
    expect(findCatalogChargeType('RENT')?.category).toBe('RENT');
    expect(chargeTypeMatchesQuery('Electricity', 'electric')).toBe(true);
    expect(chargeTypeMatchesQuery('Water', 'water')).toBe(true);
    expect(chargeTypeMatchesQuery('Laundry', 'laund')).toBe(true);
    expect(chargeTypeMatchesQuery('Rent', 'rent')).toBe(true);
    expect(chargeTypeMatchesQuery('Internet/Wi-Fi', 'wifi')).toBe(true);
    expect(chargeTypeMatchesQuery('Electricity', 'zzzz')).toBe(false);
    expect(chargeTypeMatchesQuery('Electricity', '')).toBe(true);
  });

  it('keeps manual rent off the generated monthly category', () => {
    const advance = buildManualCharge({
      category: 'RENT',
      typeId: 'ADVANCE_RENT',
      typeLabel: 'Advance rent',
      customLabel: '',
      description: '',
    });
    expect(advance?.paymentType).toBe('RENT');
    expect(advance?.paymentCategory).not.toBe('MONTHLY');
  });
});
