import { pickOptimizedImage, toLocalFileInput, type PickedImage } from './pickOptimizedImage';

export type { PickedImage } from './pickOptimizedImage';
export { toLocalFileInput } from './pickOptimizedImage';

export async function pickProfileImage(): Promise<PickedImage | null> {
  return pickOptimizedImage('PROFILE_PHOTO');
}
