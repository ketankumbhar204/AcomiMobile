import { filterInquiryPurchases, nextInquiryPurchaseStatus } from '../inquiryPurchaseFilters';

const rows = [
  {
    id: 'p1',
    userId: 'u1',
    packageId: 'pack',
    status: 'PENDING',
    userFullName: 'Asha Rao',
    userMobileNumber: '9876543210',
    utr: 'UTR111',
  },
  {
    id: 'p2',
    userId: 'u2',
    packageId: 'pack',
    status: 'APPROVED',
    userFullName: 'Ravi',
    userMobileNumber: '9123456780',
    utr: 'UTR222',
  },
  {
    id: 'p3',
    userId: 'u3',
    packageId: 'pack',
    status: 'REJECTED',
    userFullName: 'Asha',
    userMobileNumber: '9000000001',
    utr: null,
  },
  {
    id: 'p4',
    userId: 'u4',
    packageId: 'pack',
    status: 'UNKNOWN',
    userFullName: 'Mystery',
    userMobileNumber: '9876500000',
    utr: 'UTR111',
  },
];

describe('inquiryPurchaseFilters', () => {
  it('toggles a status card back to all', () => {
    expect(nextInquiryPurchaseStatus(null, 'PENDING')).toBe('PENDING');
    expect(nextInquiryPurchaseStatus('PENDING', 'PENDING')).toBeNull();
    expect(nextInquiryPurchaseStatus('PENDING', 'APPROVED')).toBe('APPROVED');
  });

  it('keeps summary-sized source data independent of the status filter', () => {
    const pending = filterInquiryPurchases(rows, 'PENDING', '');
    expect(pending.map(row => row.id)).toEqual(['p1']);
    expect(rows.filter(row => row.status === 'PENDING')).toHaveLength(1);
    expect(rows.filter(row => row.status === 'APPROVED')).toHaveLength(1);
  });

  it('combines status and mobile search', () => {
    const matched = filterInquiryPurchases(rows, 'PENDING', '9876543210');
    expect(matched.map(row => row.id)).toEqual(['p1']);
    expect(filterInquiryPurchases(rows, 'APPROVED', '9876543210')).toEqual([]);
  });

  it('matches name and UTR and leaves unknown statuses in All', () => {
    expect(filterInquiryPurchases(rows, null, 'asha').map(row => row.id)).toEqual(['p1', 'p3']);
    expect(filterInquiryPurchases(rows, 'APPROVED', 'utr222').map(row => row.id)).toEqual(['p2']);
    expect(filterInquiryPurchases(rows, null, '').map(row => row.id)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
    ]);
    expect(filterInquiryPurchases(rows, 'REJECTED', '').some(row => row.status === 'UNKNOWN')).toBe(
      false,
    );
  });
});
