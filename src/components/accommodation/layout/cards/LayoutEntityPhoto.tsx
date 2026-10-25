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
  width?: number;
  resizeMode?: ImageResizeMode;
  onChanged?: (nextFileId: string | null) => void;
};

export function LayoutEntityPhoto({
  kind,
  entityId,
  fileId,
  title,
  fallback,
  height,
  width,
  resizeMode,
  onChanged,
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
      width={width}
      resizeMode={resizeMode}
      onChanged={onChanged}
      fallback={fallback}
    />
  );
}
