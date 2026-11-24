import type { ImageSourcePropType } from 'react-native';
import { isMarketingDemoModeEnabled } from './marketingDemoMode';

/**
 * Photorealistic covers for the local synthetic spaces only.
 * A real uploaded photo still wins, because callers skip this when a file id exists.
 * These ids are the local demo spaces, not customer properties.
 */
const DEMO_SPACE_COVERS: Record<string, ImageSourcePropType> = {
  '859f3e66-453a-4a5b-ab25-56df12cdabf2': require('../../assets/marketing/sai-residency-pg-exterior.jpg'),
  'e3d201b2-0e49-4f2a-8333-c3910fafe495': require('../../assets/marketing/shree-hostel-building.jpg'),
  'b1c3049d-08d9-4ab2-aae8-11f70c8c1b5f': require('../../assets/marketing/coliving-premium-bedroom.jpg'),
  '39ddc77d-ced9-4c2f-9d85-07c0f3ec8286': require('../../assets/marketing/rental-apartment-interior.jpg'),
  '57f0698c-ec2f-4cd4-a0c8-a06e008586d4': require('../../assets/marketing/corporate-stay-bedroom.jpg'),
  '63ebe484-236c-41a3-9690-bd0ee9b965f7': require('../../assets/marketing/annapurna-mess-thali.png'),
};

export function marketingDemoCoverSource(spaceId: string): ImageSourcePropType | null {
  if (!isMarketingDemoModeEnabled()) {
    return null;
  }
  return DEMO_SPACE_COVERS[spaceId] ?? null;
}
