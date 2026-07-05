import { spaceApi } from '../api/spaceApi';
import type { AmenityAssignment } from '../api/types';
import { normalizeAmenityAssignments, supportsSpaceAmenities } from './amenities';

export async function fetchSpaceAmenities(spaceId: string): Promise<AmenityAssignment[]> {
  const details = await spaceApi.getSpaceById(spaceId);
  if (!supportsSpaceAmenities(details.type)) {
    return [];
  }
  return normalizeAmenityAssignments(details.amenities ?? []);
}
