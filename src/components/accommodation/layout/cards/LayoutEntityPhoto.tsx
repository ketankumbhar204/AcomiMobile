import React from 'react';
import type { ImageResizeMode } from 'react-native';
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
  resizeMode?: ImageResizeMode;
};

export function LayoutEntityPhoto({
  kind,
  entityId,
  fileId,
  title,
  fallback,
  height,
  resizeMode,
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
      resizeMode={resizeMode}
      fallback={fallback}
    />
  );
}
