import React from 'react';
import { ImagePreviewModal } from '../files/ImagePreviewModal';

type PaymentProofPreviewModalProps = {
  visible: boolean;
  proofUrl?: string | null;
  fileId?: string | null;
  onClose: () => void;
};

export function PaymentProofPreviewModal({
  visible,
  proofUrl,
  fileId,
  onClose,
}: PaymentProofPreviewModalProps) {
  return (
    <ImagePreviewModal
      visible={visible}
      imageUrl={proofUrl}
      fileId={fileId}
      onClose={onClose}
    />
  );
}
