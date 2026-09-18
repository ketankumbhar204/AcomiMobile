import React from 'react';
import { EntityPhoto } from '../../../files/EntityPhoto';
import { useEntityPhotoContext } from '../../../../files/EntityPhotoContext';
import type { EntityPhotoKind } from '../../../../files/entityPhoto';

type LayoutEntityPhotoProps = {
  kind: EntityPhotoKind;
  entityId: string;
  fileId?: string | null;
  title?: string;
  fallback: React.ReactNode;
  height: number;
};

export function LayoutEntityPhoto({
  kind,
  entityId,
  fileId,
  title,
  fallback,
  height,
}: LayoutEntityPhotoProps) {
  const ctx = useEntityPhotoContext();
  if (!ctx || !entityId) {
    return <>{fallback}</>;
  }
  return (
    <EntityPhoto
      spaceId={ctx.spaceId}
      entityId={entityId}
      kind={kind}
      fileId={fileId}
      canEdit={ctx.canEdit}
      title={title}
      fill
      height={height}
      fallback={fallback}
    />
  );
}
