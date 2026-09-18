import type { LocalFileInput } from '../services/fileUploadService';
import { pickOptimizedImage, toLocalFileInput, type PickedImage } from './pickOptimizedImage';

export type PickedPaymentProof = PickedImage;

export async function pickPaymentProofImage(): Promise<PickedPaymentProof | null> {
  return pickOptimizedImage('PAYMENT_PROOF');
}

export function paymentProofToLocalFile(picked: PickedPaymentProof): LocalFileInput {
  return toLocalFileInput(picked);
}

/** @deprecated Use pickPaymentProofImage() object form. */
export async function pickPaymentProofImageDataUri(): Promise<string | null> {
  const picked = await pickOptimizedImage('PAYMENT_PROOF');
  return picked?.previewUri ?? null;
}
