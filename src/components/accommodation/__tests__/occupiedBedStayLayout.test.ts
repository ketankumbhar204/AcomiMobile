import { readFileSync } from 'fs';
import { join } from 'path';

function source(relativePath: string): string {
  return readFileSync(join(__dirname, '../../../..', relativePath), 'utf8');
}

describe('occupied bed card payment layout', () => {
  const face = source('src/components/accommodation/OccupiedBedPaymentFace.tsx');
  const inventory = source('src/components/accommodation/BuildingInventoryBedCard.tsx');
  const layout = source('src/components/accommodation/layout/cards/BedLayoutCard.tsx');

  it('renders the compact balance on the tinted card, not an inset payment panel', () => {
    expect(face).toContain("t('accommodation.stayPayment.balanceDue'");
    expect(face).toContain('backgroundColor: \'transparent\'');
    expect(face).not.toContain('backgroundColor: colors.white');
    expect(inventory).toContain("bed.status === 'OCCUPIED'");
    expect(inventory).toContain('<OccupiedBedPaymentFace');
    expect(inventory).toContain('<BedPricingDisplay');
    expect(layout).toContain('<OccupiedBedPaymentFace');
  });
});

describe('occupied bed details layout', () => {
  const stay = source('src/components/accommodation/OccupiedBedStaySection.tsx');
  const sheet = source('src/components/accommodation/BedInteractionSheet.tsx');

  it('places labels and values on one row with the value on the right', () => {
    expect(stay).toContain("flexDirection: 'row'");
    expect(stay).toContain("textAlign: 'right'");
    expect(stay).toContain("alignItems: 'flex-end'");
    expect(stay).toContain('ChevronUp');
    expect(stay).toContain('IndianRupee');
    expect(stay).not.toContain('styles.row');
  });

  it('keeps the profile action, occupant empty state, and payment strip', () => {
    expect(stay).toContain('occupancy.targetOccupant.viewMember');
    expect(stay).toContain('stay.occupancy?.memberId');
    expect(stay).toContain('accommodation.stayPayment.noTenant');
    expect(stay).toContain('bedCardBalanceFace');
    expect(stay).toContain('accommodation.stayPayment.remaining');
    expect(sheet).toContain('<OccupiedBedStaySection');
    expect(sheet).toContain("status === 'OCCUPIED'");
  });
});
