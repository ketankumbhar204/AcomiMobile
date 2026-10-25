import { readFileSync } from 'fs';
import { join } from 'path';
import {
  accommodationIllustrations,
  getBedIllustration,
  getBuildingIllustration,
  getFloorIllustration,
  getRoomIllustration,
  getUnitIllustration,
} from '../illustrationAssets';

function source(relativePath: string): string {
  return readFileSync(join(__dirname, '../../../../../../', relativePath), 'utf8');
}

describe('default accommodation illustrations', () => {
  it('maps room sharing capacity to the existing room drawings', () => {
    expect(getRoomIllustration(1)).toBe(accommodationIllustrations.roomSingle);
    expect(getRoomIllustration(2)).toBe(accommodationIllustrations.roomDouble);
    expect(getRoomIllustration(3)).toBe(accommodationIllustrations.roomTriple);
    expect(getRoomIllustration(4)).toBe(accommodationIllustrations.roomQuad);
    expect(getRoomIllustration(5)).toBe(accommodationIllustrations.roomFiveBeds);
    expect(getRoomIllustration(6)).toBe(accommodationIllustrations.roomSixBeds);
    expect(getRoomIllustration(8)).toBe(accommodationIllustrations.roomSixBeds);
  });

  it('maps a bed to the drawing for its stored status', () => {
    expect(getBedIllustration('AVAILABLE')).toBe(accommodationIllustrations.bedAvailable);
    expect(getBedIllustration('RESERVED')).toBe(accommodationIllustrations.bedReserved);
    expect(getBedIllustration('OCCUPIED')).toBe(accommodationIllustrations.bedOccupied);
    expect(getBedIllustration('MAINTENANCE')).toBe(accommodationIllustrations.bedMaintenance);
    expect(getBedIllustration('BLOCKED')).toBe(accommodationIllustrations.bedMaintenance);
  });

  it('keeps the existing building, floor, and unit drawings', () => {
    expect(getBuildingIllustration()).toBe(accommodationIllustrations.building);
    expect(getFloorIllustration()).toBe(accommodationIllustrations.floor);
    expect(getFloorIllustration('CORRIDOR_PG')).toBe(accommodationIllustrations.corridorFloor);
    expect(getUnitIllustration(2, 6)).toBe(accommodationIllustrations.unitSmall);
    expect(getUnitIllustration(6, 30)).toBe(accommodationIllustrations.unitMedium);
    expect(getUnitIllustration(10, 50)).toBe(accommodationIllustrations.unitLarge);
  });
});

describe('entity photo fallback stays tappable', () => {
  const photo = source('src/components/accommodation/layout/cards/LayoutEntityPhoto.tsx');
  const hero = source('src/components/accommodation/BedDetailHero.tsx');
  const entityPhoto = source('src/components/files/EntityPhoto.tsx');

  it('keeps the upload control when no photo has been saved', () => {
    expect(photo).toContain('<EntityPhoto');
    expect(photo).toContain('fileId={fileId}');
    expect(photo).toContain('onChanged={onChanged}');
    expect(photo).not.toContain('!fileId');
  });

  it('fills the existing bed well without resizing it', () => {
    expect(hero).toContain('width={visualSize}');
    expect(hero).toContain('height={visualSize}');
    expect(hero).toContain('compactBedVisualSize');
    expect(hero).toContain('getBedIllustration(status)');
    expect(hero).toContain('visualWell:');
    expect(hero).toContain('backgroundColor: pastels.green.bg');
  });

  it('shows the default asset when the remote photo is missing or fails', () => {
    expect(entityPhoto).toContain('onError={() => setImageFailed(true)}');
    expect(entityPhoto).toContain('activeFileId && previewUrl && !imageFailed');
    expect(entityPhoto).toContain('canEdit');
    expect(entityPhoto).toContain('pickOptimizedImage');
  });
});
