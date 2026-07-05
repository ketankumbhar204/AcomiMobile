import React from 'react';
import { ImageEntityTile, type ImageEntityTileProps } from './ImageEntityTile';
import type { AccommodationSpriteKey } from './accommodationLayoutAssets';

type VisualBlockProps = Omit<ImageEntityTileProps, 'sprite'> & {
  sprite?: AccommodationSpriteKey;
};

/** @deprecated Use ImageEntityTile */
export function VisualBlock({ sprite = 'room', ...props }: VisualBlockProps) {
  return <ImageEntityTile sprite={sprite} {...props} />;
}
